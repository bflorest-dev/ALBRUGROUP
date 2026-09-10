import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';
import { MetricsPeriodo } from '../../../../shared/components/period-selector/period-selector.component';
import { VentaSeguimientoDetalle } from '../../services/venta-seguimiento.service';
import {
  AsesorVista,
  BUCKET_RETORNO,
  BUCKET_SIN_GESTIONAR,
  VentaSeguimientoFacade,
  estadoMeta
} from '../../facades/venta-seguimiento.facade';

type GroupBy = 'none' | 'asesor' | 'tipificacion' | 'ubicacion';

interface DetalleGrupo {
  key: string;
  label: string;
  cantidad: number;
  filas: VentaSeguimientoDetalle[];
}

/**
 * Panel DASHBOARD > Seguimiento (etapa VENTA): réplica web del reporte diario del equipo como un poster
 * oscuro capturable. Embudo (ingresadas→subidas→instaladas) + distribución por tipificación + preventas por
 * asesor + detalle. Provee su propio facade (bloque autónomo) y proyecta los controles del dashboard por
 * `ng-content`. El buscar/agrupar/filtrar del detalle y los % son client-side.
 */
@Component({
  selector: 'app-venta-seguimiento-panel',
  imports: [DecimalPipe, TooltipModule, MessageModule],
  providers: [VentaSeguimientoFacade],
  templateUrl: './venta-seguimiento-panel.component.html',
  styleUrl: './venta-seguimiento-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VentaSeguimientoPanelComponent implements OnInit {
  protected readonly facade = inject(VentaSeguimientoFacade);

  readonly externalControls = input(false);
  readonly idEquipo = input<number | null>(null);
  readonly idProveedor = input<number | null>(null);
  readonly teamScoped = input(false);
  readonly periodo = input<MetricsPeriodo | null>(null);
  readonly dia = input<string | null>(null);
  readonly hasta = input<string | null>(null);

  // Herramientas del detalle (todas client-side sobre la lista ya cargada).
  protected readonly search = signal('');
  protected readonly groupBy = signal<GroupBy>('none');
  protected readonly filtroAsesor = signal<string | null>(null);
  protected readonly filtroTipi = signal<string | null>(null);

  private static readonly MESES = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
  ];
  private static readonly ACCENT_FALLBACK = '#3457d5';

  protected readonly teamAccent = computed(
    () => this.facade.equipoInfo()?.color || VentaSeguimientoPanelComponent.ACCENT_FALLBACK
  );

  /** Texto legible sobre la banda del color del equipo (luminancia YIQ): claro→tinta oscura, oscuro→blanco. */
  protected readonly teamOn = computed(() => {
    const rgb = this.parseHex(this.teamAccent());
    if (!rgb) {
      return '#ffffff';
    }
    const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return yiq >= 150 ? '#1a1005' : '#ffffff';
  });

  protected readonly fechaLabel = computed(() => {
    const periodo = this.periodo();
    if (periodo === 'semana') {
      return 'Semana operativa';
    }
    if (periodo === 'mes') {
      return 'Mes en curso';
    }
    const dia = this.dia();
    if (!dia) {
      return 'Hoy';
    }
    const hasta = this.hasta();
    if (hasta && hasta !== dia) {
      return `${this.fechaLarga(dia)} – ${this.fechaLarga(hasta)}`;
    }
    return this.fechaLarga(dia);
  });

  /** Anchos del embudo relativos a "ingresadas" (la barra más ancha). */
  protected readonly anchoSubidas = computed(() => this.ancho(this.facade.contadores().subidas));
  protected readonly anchoInstaladas = computed(() => this.ancho(this.facade.contadores().instaladas));

  /** Opciones de filtro derivadas del detalle cargado (nombres de asesor y estados presentes). */
  protected readonly asesorOptions = computed<string[]>(() => {
    const set = new Set<string>();
    for (const fila of this.facade.detalle()) {
      if (fila.asesorMerito) {
        set.add(fila.asesorMerito);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  });

  protected readonly tipiOptions = computed<Array<{ value: string; label: string }>>(() => {
    const set = new Set<string>();
    for (const fila of this.facade.detalle()) {
      set.add(fila.clasificacion ?? BUCKET_SIN_GESTIONAR);
    }
    return [...set].map((clave) => ({ value: clave, label: estadoMeta(clave).label }));
  });

  private readonly filteredDetalle = computed<VentaSeguimientoDetalle[]>(() => {
    const q = this.search().trim().toLowerCase();
    const asesor = this.filtroAsesor();
    const tipi = this.filtroTipi();
    return this.facade.detalle().filter((fila) => {
      if (asesor && fila.asesorMerito !== asesor) {
        return false;
      }
      if (tipi && (fila.clasificacion ?? BUCKET_SIN_GESTIONAR) !== tipi) {
        return false;
      }
      if (!q) {
        return true;
      }
      return [fila.lead, fila.numeroDocumento, fila.nombreCliente, fila.comentario]
        .some((campo) => (campo ?? '').toLowerCase().includes(q));
    });
  });

  protected readonly grupos = computed<DetalleGrupo[]>(() => {
    const filas = this.filteredDetalle();
    const by = this.groupBy();
    if (by === 'none') {
      return [{ key: '', label: '', cantidad: filas.length, filas }];
    }
    const mapa = new Map<string, DetalleGrupo>();
    for (const fila of filas) {
      const { key, label } = this.grupoDe(fila, by);
      const grupo = mapa.get(key) ?? { key, label, cantidad: 0, filas: [] };
      grupo.cantidad++;
      grupo.filas.push(fila);
      mapa.set(key, grupo);
    }
    return [...mapa.values()].sort((a, b) => b.cantidad - a.cantidad);
  });

  protected readonly showGroupHeaders = computed(() => this.groupBy() !== 'none');
  protected readonly totalFiltrado = computed(() => this.filteredDetalle().length);
  protected readonly hayFiltros = computed(
    () => !!this.search().trim() || this.filtroAsesor() !== null || this.filtroTipi() !== null
  );

  constructor() {
    effect(() => {
      if (!this.externalControls()) {
        return;
      }
      this.facade.setIdEquipo(this.idEquipo());
      this.facade.setIdProveedor(this.idProveedor());
      this.facade.setPeriodo(this.periodo());
      const dia = this.dia();
      if (dia) {
        this.facade.setRango(dia, this.hasta() || dia);
      }
    });
  }

  ngOnInit(): void {
    this.facade.setIdEquipo(this.idEquipo());
    this.facade.setIdProveedor(this.idProveedor());
    if (this.periodo()) {
      this.facade.setPeriodo(this.periodo());
    }
    const dia = this.dia();
    if (dia) {
      this.facade.setRango(dia, this.hasta() || dia);
    }
    this.facade.start();
  }

  protected onSearch(value: string): void {
    this.search.set(value);
  }

  protected onGroupBy(value: string): void {
    this.groupBy.set((value as GroupBy) || 'none');
  }

  protected onFiltroAsesor(value: string): void {
    this.filtroAsesor.set(value || null);
  }

  protected onFiltroTipi(value: string): void {
    this.filtroTipi.set(value || null);
  }

  protected limpiarFiltros(): void {
    this.search.set('');
    this.filtroAsesor.set(null);
    this.filtroTipi.set(null);
  }

  /** Etiqueta + color del estado (bucket) de una fila, para el pill del detalle. */
  protected pillMeta(fila: VentaSeguimientoDetalle): { label: string; color: string } {
    const clave = fila.clasificacion ?? BUCKET_SIN_GESTIONAR;
    const meta = estadoMeta(clave);
    const esBucket = clave === BUCKET_RETORNO || clave === BUCKET_SIN_GESTIONAR;
    const sub = !esBucket && fila.ultimaCodigoSubtipificacion
      ? ` · ${this.capitalizar(fila.ultimaCodigoSubtipificacion)}`
      : '';
    return { label: `${meta.label}${sub}`, color: meta.color };
  }

  /** Barra apilada de un asesor: segmentos con su % de ancho sobre el total del asesor. */
  protected segmentos(asesor: AsesorVista): Array<{ key: string; width: number; color: string; label: string; cantidad: number }> {
    return asesor.celdas.map((celda) => ({
      key: celda.clave,
      width: asesor.total > 0 ? (celda.cantidad / asesor.total) * 100 : 0,
      color: celda.color,
      label: celda.label,
      cantidad: celda.cantidad
    }));
  }

  /** Fecha relevante en texto corto: "DD/MM · Tipo" (con hora si es programación). */
  protected fechaRelevanteLabel(fila: VentaSeguimientoDetalle): string {
    const tipo = fila.tipoFechaRelevante;
    if (tipo === 'TIPIFICACION') {
      const at = this.fechaHora(fila.fechaRelevanteAt);
      return at ? `${at} · Tipificación` : '—';
    }
    const fecha = this.fechaCorta(fila.fechaRelevante);
    if (!fecha) {
      return '—';
    }
    switch (tipo) {
      case 'PROGRAMACION': {
        const hora = fila.horaRelevante ? ` ${fila.horaRelevante.slice(0, 5)}` : '';
        return `${fecha}${hora} · Programación`;
      }
      case 'RECHAZO':
        return `${fecha} · Rechazo`;
      case 'INSTALACION':
        return `${fecha} · Instalación`;
      default:
        return fecha;
    }
  }

  protected ubicacion(fila: VentaSeguimientoDetalle): string {
    if (fila.departamento && fila.distrito) {
      return `${fila.departamento} · ${fila.distrito}`;
    }
    return fila.departamento || fila.distrito || fila.ubigeo || '—';
  }

  /** Hora local (America/Lima) HH:MM de un instante ISO (columna Ingreso). */
  protected hora(iso: string | null): string {
    if (!iso) {
      return '—';
    }
    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) {
      return '—';
    }
    return fecha.toLocaleTimeString('es-PE', {
      timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: false
    });
  }

  private fechaHora(iso: string | null): string {
    if (!iso) {
      return '';
    }
    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) {
      return '';
    }
    return fecha.toLocaleString('es-PE', {
      timeZone: 'America/Lima', day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
  }

  /** `2026-09-10` → `10/09`. */
  private fechaCorta(iso: string | null): string {
    if (!iso) {
      return '';
    }
    const [, mes, dd] = iso.split('-');
    return dd && mes ? `${dd}/${mes}` : iso;
  }

  private fechaLarga(iso: string): string {
    const [anio, mes, dd] = iso.split('-').map((parte) => Number(parte));
    if (!anio || !mes || !dd) {
      return iso;
    }
    return `${dd} ${VentaSeguimientoPanelComponent.MESES[mes - 1]} ${anio}`;
  }

  private ancho(cantidad: number): number {
    const ingresadas = this.facade.contadores().ingresadas;
    return ingresadas > 0 ? (cantidad / ingresadas) * 100 : 0;
  }

  private grupoDe(fila: VentaSeguimientoDetalle, by: GroupBy): { key: string; label: string } {
    if (by === 'asesor') {
      const nombre = fila.asesorMerito ?? 'Sin mérito';
      return { key: nombre, label: nombre };
    }
    if (by === 'tipificacion') {
      const clave = fila.clasificacion ?? BUCKET_SIN_GESTIONAR;
      return { key: clave, label: estadoMeta(clave).label };
    }
    const dep = fila.departamento ?? 'Sin ubicación';
    return { key: dep, label: dep };
  }

  private capitalizar(texto: string): string {
    const limpio = texto.trim().toLowerCase();
    return limpio.length ? limpio.charAt(0).toUpperCase() + limpio.slice(1) : texto;
  }

  private parseHex(hex: string): { r: number; g: number; b: number } | null {
    const clean = hex.replace('#', '').trim();
    if (clean.length !== 6) {
      return null;
    }
    const value = Number.parseInt(clean, 16);
    if (Number.isNaN(value)) {
      return null;
    }
    return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
  }
}
