import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
import {
  MetricsPeriodo,
  PeriodSelectorComponent
} from '../../../../shared/components/period-selector/period-selector.component';
import { MetricsRango, localToday, resolveMetricsRange } from '../../../../shared/utils/metrics-period';
import { SessionService } from '../../../../core/services/session.service';
import {
  DashboardVentaResponse,
  DashboardVentaService,
  DashboardVentaTramosResponse,
  EnfoqueVenta,
  MetricaVentaDetalle,
  ProveedorRef
} from '../../services/dashboard-venta.service';
import {
  DashboardVentaDetalleDrawerComponent,
  DetalleDrawerReq
} from '../dashboard-venta-detalle-drawer/dashboard-venta-detalle-drawer.component';

type Vista = 'resumen' | 'asesores';
type ZonaSel = 'total' | 'lima' | 'provincia';

interface CounterCard {
  key: string;
  label: string;
  value: number;
  color: string;
  width: number;
  nota: string;
  tone: '' | 'good' | 'bad';
}

interface ConversionVm {
  label: string;
  pct: number;
  frac: string;
  metrica: MetricaVentaDetalle;
}

interface EstadoVm {
  label: string;
  color: string;
  cantidad: number;
  pct: number;
  width: number;
  codigo: string | null;
}

interface ZonaRowVm {
  label: string;
  hint?: string;
  lima: number;
  provincia: number;
  total: number;
  drill?: 'registradas' | 'instaladas';
}

interface ProgRowVm {
  label: string;
  codigo: string | null;
  cantidad: number;
  width: number;
}

interface TramoVm {
  label: string;
  rango: string;
  hoy: number;
  manana: number;
  pasado: number;
}

interface RankingVm {
  idAsesor: number;
  nombre: string;
  inicial: string;
  color: string;
  registradas: number;
  instaladas: number;
  conv: number;
  regLima: number;
  instLima: number;
  convLima: number;
  regProv: number;
  instProv: number;
  convProv: number;
}

interface CfVm {
  scope: string;
  total: number;
  promedio: number;
  base: number;
}

// Códigos operativos de VENTA → etiqueta, color y orden de despliegue.
const ESTADO_META: Record<string, { label: string; color: string; orden: number }> = {
  SIN_INGRESAR: { label: 'Sin ingresar', color: 'faint', orden: 0 },
  'SIN INGRESAR': { label: 'Sin ingresar', color: 'faint', orden: 0 },
  INGRESADO: { label: 'Ingresado', color: 'info', orden: 1 },
  SUBIDO: { label: 'Ingresado', color: 'info', orden: 1 },
  SUBSANABLE: { label: 'Subsanable', color: 'warning', orden: 2 },
  'NO RECUPERABLE': { label: 'No recuperable', color: 'danger', orden: 3 },
  PROGRAMADO: { label: 'Programado', color: 'secondary', orden: 4 },
  INSTALADO: { label: 'Instalada', color: 'success', orden: 5 }
};

const AVATAR_COLORS = ['#c73a53', '#3a3f8f', '#1f9d9d', '#b9770a', '#2f6bd0', '#158a5c', '#7a4fd0'];

// Por ahora el dashboard solo ofrece Claro y Win (los únicos con planes vigentes).
const PROVEEDORES_VISIBLES = new Set(['CLARO', 'WIN']);

// Acento del poster por proveedor (banda del header), como el color de equipo en PREVENTA.
const PROVEEDOR_ACCENT: Record<string, string> = { CLARO: '#c8384b', WIN: '#e8752b' };
const PROVEEDOR_ACCENT_DEFAULT = '#3a3f8f';

@Component({
  selector: 'app-dashboard-venta-stage',
  imports: [
    DecimalPipe,
    FormsModule,
    ButtonModule,
    CardModule,
    MessageModule,
    SelectButtonModule,
    TooltipModule,
    PeriodSelectorComponent,
    DashboardVentaDetalleDrawerComponent
  ],
  templateUrl: './dashboard-venta-stage.component.html',
  styleUrl: './dashboard-venta-stage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardVentaStageComponent implements OnInit {
  private readonly service = inject(DashboardVentaService);
  // El cargo fijo (dato financiero) solo lo ve el administrador.
  protected readonly esAdmin = inject(SessionService).getPrimaryRole() === 'ADMINISTRADOR';

  protected readonly proveedores = signal<ProveedorRef[]>([]);
  protected readonly proveedorId = signal<number | null>(null);
  protected readonly vista = signal<Vista>('resumen');
  protected readonly periodo = signal<MetricsPeriodo>('dia');
  // "Hoy" arranca con el día actual explícito: sin él, resolveMetricsRange devuelve {} y el backend
  // cae a "mes en curso", mostrando el cohorte del mes bajo la etiqueta "Hoy". Debe mandar desde=hasta=hoy.
  protected readonly dia = signal<string | null>(localToday());
  protected readonly hasta = signal<string | null>(null);
  protected readonly zonaSel = signal<ZonaSel>('total');

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  private readonly data = signal<DashboardVentaResponse | null>(null);
  private readonly tramos = signal<DashboardVentaTramosResponse | null>(null);

  protected readonly vistaOptions: Array<{ label: string; value: Vista }> = [
    { label: 'Resumen', value: 'resumen' },
    { label: 'Asesores', value: 'asesores' }
  ];
  protected readonly zonaOptions: Array<{ label: string; value: ZonaSel }> = [
    { label: 'Todos', value: 'total' },
    { label: 'Lima', value: 'lima' },
    { label: 'Provincia', value: 'provincia' }
  ];

  protected readonly proveedorOptions = computed(() =>
    this.proveedores().map((p) => ({ label: p.nombre, value: p.id }))
  );

  protected readonly hayDatos = computed(() => this.data() !== null);

  protected readonly proveedorNombre = computed(
    () => this.proveedores().find((p) => p.id === this.proveedorId())?.nombre ?? ''
  );
  protected readonly providerAccent = computed(
    () => PROVEEDOR_ACCENT[this.proveedorNombre().toUpperCase()] ?? PROVEEDOR_ACCENT_DEFAULT
  );
  protected readonly periodoLabel = computed(() => {
    const p = this.periodo();
    if (p === 'mes') return 'Mensual';
    if (p === 'semana') return 'Semanal';
    const d = this.dia();
    // Un día suelto (sin rango) que es hoy se muestra como "Hoy"; cualquier otro, como su fecha.
    return !d || (d === localToday() && !this.hasta()) ? 'Hoy' : d;
  });
  /**
   * Etiqueta de la fila del cohorte (enfoque DÍA), acorde al período: "Del día" solo cuando es un día
   * suelto; con un rango/semana/mes esa fila muestra los que ingresaron en TODO el período, no en un día.
   */
  protected readonly enfoqueDiaLabel = computed(() => {
    const p = this.periodo();
    if (p === 'mes') return 'Del mes';
    if (p === 'semana') return 'De la semana';
    const hasta = this.hasta();
    return hasta && hasta !== this.dia() ? 'Del período' : 'Del día';
  });
  protected readonly tituloVista = computed(() =>
    this.vista() === 'resumen' ? 'Resumen de venta' : 'Rendimiento por asesor'
  );

  // ── Contadores + conversiones ────────────────────────────────────────────────────────────────
  protected readonly counterCards = computed<CounterCard[]>(() => {
    const c = this.data()?.contadores;
    if (!c) return [];
    const base = c.preventasCompletas || 1;
    return [
      { key: 'preventas', label: 'Preventas', value: c.preventasCompletas, color: 'primary', width: 100, nota: 'Preventas válidas', tone: '' },
      { key: 'registradas', label: 'Registradas', value: c.ventasRegistradas, color: 'info', width: this.w(c.ventasRegistradas, base), nota: 'En ingresado', tone: '' },
      { key: 'programadas', label: 'Programadas', value: c.ventasProgramadasActual, color: 'secondary', width: this.w(c.ventasProgramadasActual, base), nota: 'En programado', tone: '' },
      { key: 'rechazadas', label: 'Rechazadas', value: c.ventasRechazadas, color: 'danger', width: this.w(c.ventasRechazadas, base), nota: 'Ventas rechazadas', tone: 'bad' },
      { key: 'instaladas', label: 'Instaladas', value: c.ventasInstaladas, color: 'success', width: this.w(c.ventasInstaladas, base), nota: 'Instaladas del período', tone: 'good' }
    ];
  });

  protected readonly conversiones = computed<ConversionVm[]>(() => {
    const c = this.data()?.contadores;
    if (!c) return [];
    // Las 6 conversiones usan el EMBUDO (mayor rango, anidado), NO los cards: así son monotónicas y ≤100%.
    // Al hacer click, el drawer muestra el NUMERADOR (el subconjunto del embudo) de esa conversión.
    return [
      { label: 'Preventas → Registradas', pct: this.pct(c.registradasFunnel, c.preventasCompletas), frac: `${c.registradasFunnel}/${c.preventasCompletas}`, metrica: 'EMBUDO_REGISTRADAS' },
      { label: 'Preventas → Instaladas', pct: this.pct(c.instaladasFunnel, c.preventasCompletas), frac: `${c.instaladasFunnel}/${c.preventasCompletas}`, metrica: 'EMBUDO_INSTALADAS' },
      { label: 'Registradas → Instaladas', pct: this.pct(c.instaladasFunnel, c.registradasFunnel), frac: `${c.instaladasFunnel}/${c.registradasFunnel}`, metrica: 'EMBUDO_INSTALADAS' },
      { label: 'Preventas → Rechazadas', pct: this.pct(c.rechazadasFunnel, c.preventasCompletas), frac: `${c.rechazadasFunnel}/${c.preventasCompletas}`, metrica: 'EMBUDO_RECHAZADAS' },
      { label: 'Programadas → Instaladas', pct: this.pct(c.programadasInstaladas, c.programadasTotal), frac: `${c.programadasInstaladas}/${c.programadasTotal}`, metrica: 'EMBUDO_PROGRAMADAS_INSTALADAS' },
      { label: 'Programadas → Rechazadas', pct: this.pct(c.programadasRechazadas, c.programadasTotal), frac: `${c.programadasRechazadas}/${c.programadasTotal}`, metrica: 'EMBUDO_PROGRAMADAS_RECHAZADAS' }
    ];
  });

  // ── Cuadrante: PREVENTAS (ancla) + los 2 enfoques ────────────────────────────────────────────
  protected readonly tipDelDia =
    'Las preventas que ingresaron en la fecha o rango elegido, según cómo están ahora. Suman el total de Preventas.';
  protected readonly tipGeneral =
    'Todo lo que sigue pendiente en cada estado hasta hoy, más lo que se rechazó o instaló en la fecha o rango elegido.';

  // Estados de la matriz: nombre, color del subrayado y texto (oculto en tooltip, en lenguaje de usuario).
  protected readonly cuadranteStates = [
    { key: 'sinIngresar', label: 'Sin ingresar', color: 'var(--faint)', headTip: 'Sin ingresar — La venta todavía no se ingresa al sistema.' },
    { key: 'registradas', label: 'Registradas', color: 'var(--vd-info)', headTip: 'Registradas — Venta ingresada, a la espera de que se agende la instalación.' },
    { key: 'programadas', label: 'Programadas', color: 'var(--vd-teal)', headTip: 'Programadas — Con fecha de instalación agendada.' },
    { key: 'subsanables', label: 'Subsanables', color: 'var(--vd-warning)', headTip: 'Subsanables — Observadas: falta corregir algo para poder avanzar.' },
    { key: 'rechazadas', label: 'Rechazadas', color: 'var(--vd-danger)', headTip: 'Rechazadas — Descartadas: no se concretaron.' },
    { key: 'instaladas', label: 'Instaladas', color: 'var(--vd-success)', headTip: 'Instaladas — Instaladas y facturando.' }
  ] as const;

  protected readonly preventas = computed(() => this.data()?.preventas ?? 0);

  protected readonly diaCells = computed(() => {
    const e = this.data()?.enfoqueDia ?? null;
    return this.cuadranteStates.map((s) => {
      let tip = '';
      if (s.key === 'instaladas' && e && e.instaladasEnVentana < e.instaladas) {
        tip = `De estas ${e.instaladas}, ${e.instaladasEnVentana} se instalaron dentro de la fecha o rango elegido.`;
      }
      return { key: s.key, label: s.label, value: e ? e[s.key] : 0, tip };
    });
  });

  protected readonly generalCells = computed(() => {
    const e = this.data()?.enfoqueGeneral ?? null;
    return this.cuadranteStates.map((s) => ({ key: s.key, label: s.label, value: e ? e[s.key] : 0 }));
  });

  // ── Estado por tipificación ──────────────────────────────────────────────────────────────────
  protected readonly estadoRows = computed<EstadoVm[]>(() => {
    const d = this.data();
    if (!d) return [];
    // El breakdown cubre TODO el cohorte por última (incluye sin-ingresar/rechazadas), no solo las
    // preventas válidas; su denominador es su propia suma, no el card "Preventas" (que es más chico).
    const total = d.estadoLeads.reduce((acc, e) => acc + e.cantidad, 0) || 1;
    const max = Math.max(1, ...d.estadoLeads.map((e) => e.cantidad));
    return d.estadoLeads
      .map((e) => {
        const key = e.codigo ?? 'SIN_INGRESAR';
        const meta = ESTADO_META[key] ?? { label: e.codigo ?? 'Sin ingresar', color: 'faint', orden: 9 };
        return {
          label: meta.label,
          color: meta.color,
          cantidad: e.cantidad,
          pct: this.pct(e.cantidad, total),
          width: this.w(e.cantidad, max),
          orden: meta.orden,
          codigo: e.codigo
        };
      })
      .sort((a, b) => a.orden - b.orden);
  });

  // ── Zonas + cargo fijo ───────────────────────────────────────────────────────────────────────
  protected readonly zonaRows = computed<ZonaRowVm[]>(() => {
    const z = this.data()?.zonas;
    if (!z) return [];
    return [
      { label: 'Registradas', drill: 'registradas', lima: z.lima.registradas, provincia: z.provincia.registradas, total: z.lima.registradas + z.provincia.registradas },
      { label: 'Instaladas', drill: 'instaladas', lima: z.lima.instaladas, provincia: z.provincia.instaladas, total: z.lima.instaladas + z.provincia.instaladas },
      { label: '…e instaladas en el mes', hint: 'registró e instaló en el período', lima: z.lima.registradasEInstaladas, provincia: z.provincia.registradasEInstaladas, total: z.lima.registradasEInstaladas + z.provincia.registradasEInstaladas }
    ];
  });

  protected readonly sinUbigeo = computed(() => this.data()?.zonas.sinUbigeo.registradas ?? 0);

  protected readonly cf = computed<CfVm>(() => {
    const z = this.data()?.zonas;
    if (!z) return { scope: 'Todos', total: 0, promedio: 0, base: 0 };
    const sel = this.zonaSel();
    if (sel === 'lima') return { scope: 'Lima', total: z.lima.cfTotal, promedio: z.lima.cfPromedio, base: z.lima.instaladas };
    if (sel === 'provincia') return { scope: 'Provincia', total: z.provincia.cfTotal, promedio: z.provincia.cfPromedio, base: z.provincia.instaladas };
    const total = z.lima.cfTotal + z.provincia.cfTotal;
    const base = z.lima.instaladas + z.provincia.instaladas;
    const promedio = base ? total / base : 0;
    return { scope: 'Todos', total, promedio, base };
  });

  // ── Programación (bloque 3) ──────────────────────────────────────────────────────────────────
  protected readonly programacionRows = computed<ProgRowVm[]>(() => {
    const p = this.data()?.programacionActual;
    if (!p) return [];
    const max = Math.max(1, ...p.porSubtipificacion.map((s) => s.cantidad));
    return [...p.porSubtipificacion]
      .sort((a, b) => b.cantidad - a.cantidad)
      .map((s) => ({ label: this.subtipLabel(s.codigo), codigo: s.codigo, cantidad: s.cantidad, width: this.w(s.cantidad, max) }));
  });

  protected readonly programacionTotal = computed(() => this.data()?.programacionActual.total ?? 0);

  // ── Tramos (bloque 4) ────────────────────────────────────────────────────────────────────────
  protected readonly tramoRows = computed<TramoVm[]>(() => {
    const t = this.tramos();
    if (!t) return [];
    const label: Record<string, string> = { TRAMO_1: 'Tramo 1', TRAMO_2: 'Tramo 2', TRAMO_3: 'Tramo 3', OTROS: 'Otros' };
    return t.tramos
      .filter((tr) => tr.codigo !== 'OTROS' || tr.hoy + tr.manana + tr.pasado > 0)
      .map((tr) => ({
        label: label[tr.codigo] ?? tr.codigo,
        rango: tr.desde ? `${this.hhmm(tr.desde)} – ${this.hhmm(tr.hasta)}` : 'Fuera de horario',
        hoy: tr.hoy,
        manana: tr.manana,
        pasado: tr.pasado
      }));
  });

  protected readonly tramoMax = computed(() => {
    const rows = this.tramoRows();
    return Math.max(1, ...rows.flatMap((r) => [r.hoy, r.manana, r.pasado]));
  });

  // ── Ranking (bloque 6) ───────────────────────────────────────────────────────────────────────
  protected readonly rankingRows = computed<RankingVm[]>(() => {
    const d = this.data();
    if (!d) return [];
    return d.ranking.map((a, i) => {
      const nombre = a.nombre ?? 'Sin nombre';
      return {
        idAsesor: a.idAsesor,
        nombre,
        inicial: this.iniciales(nombre),
        color: AVATAR_COLORS[i % AVATAR_COLORS.length],
        registradas: a.registradas,
        instaladas: a.instaladas,
        conv: this.pct(a.instaladas, a.registradas),
        regLima: a.registradasLima,
        instLima: a.instaladasLima,
        convLima: this.pct(a.instaladasLima, a.registradasLima),
        regProv: a.registradasProvincia,
        instProv: a.instaladasProvincia,
        convProv: this.pct(a.instaladasProvincia, a.registradasProvincia)
      };
    });
  });

  // ── Drawer de detalle (drill-down unificado) ─────────────────────────────────────────────────
  protected readonly detalleReq = signal<DetalleDrawerReq | null>(null);

  private readonly STATE_METRICA: Record<string, MetricaVentaDetalle> = {
    sinIngresar: 'SIN_INGRESAR',
    registradas: 'REGISTRADAS',
    programadas: 'PROGRAMADAS',
    subsanables: 'SUBSANABLES',
    rechazadas: 'RECHAZADAS',
    instaladas: 'INSTALADAS'
  };

  private abrir(metrica: MetricaVentaDetalle, titulo: string, subtitulo: string, extra: Partial<DetalleDrawerReq> = {}): void {
    const idProveedor = this.proveedorId();
    if (idProveedor === null) return;
    const range = resolveMetricsRange(this.periodo(), this.dia(), this.hasta());
    this.detalleReq.set({ idProveedor, metrica, titulo, subtitulo, desde: range.desde, hasta: range.hasta, ...extra });
  }

  protected abrirPreventas(): void {
    this.abrir('PREVENTAS', 'Preventas', 'Preventas del período');
  }
  protected abrirEstado(key: string, enfoque: EnfoqueVenta, label: string): void {
    const metrica = this.STATE_METRICA[key];
    if (!metrica) return;
    this.abrir(metrica, label, enfoque === 'DIA' ? this.enfoqueDiaLabel() : 'Gestión general', { enfoque });
  }
  protected abrirConversion(c: ConversionVm): void {
    this.abrir(c.metrica, c.label, 'Conversión (embudo)');
  }
  protected abrirProgramacion(p: ProgRowVm): void {
    this.abrir('PROGRAMACION_SUBTIP', p.label, 'Programados ahora', { subtipificacion: p.codigo ?? undefined });
  }
  // Distribución "Por tipificación": cohorte del período por su última cruda (null = sin ingresar).
  protected abrirDistribucion(e: EstadoVm): void {
    this.abrir('COHORTE_ULTIMA', e.label, 'Por tipificación', { tipificacion: e.codigo ?? undefined });
  }
  // Zonas "Registradas": ancla en última gestión del período (última == INGRESADO), acotado por zona.
  protected abrirZonaRegistradas(zona: 'LIMA' | 'PROVINCIA' | 'SIN_UBIGEO', label: string): void {
    this.abrir('ZONA_REGISTRADAS', 'Registradas', label, { zona });
  }
  // Zonas "Instaladas": instaladas del período por fechaInstalacion (enfoque GENERAL), acotado por zona.
  protected abrirZonaInstaladas(zona: 'LIMA' | 'PROVINCIA', label: string): void {
    this.abrir('INSTALADAS', 'Instaladas', label, { enfoque: 'GENERAL', zona });
  }
  // Despacha el drill de una celda (Lima/Provincia) según la fila de la tabla de territorio.
  protected abrirZonaCelda(row: ZonaRowVm, zona: 'LIMA' | 'PROVINCIA'): void {
    const label = zona === 'LIMA' ? 'Lima' : 'Provincia';
    if (row.drill === 'registradas') this.abrirZonaRegistradas(zona, label);
    else if (row.drill === 'instaladas') this.abrirZonaInstaladas(zona, label);
  }
  protected abrirTramos(): void {
    this.abrir('TRAMOS', 'Con cita a futuro', 'Hoy · Mañana · Pasado');
  }
  protected abrirAsesor(a: RankingVm): void {
    this.abrir('RANKING', a.nombre, 'Preventas del asesor', { idAsesor: a.idAsesor });
  }
  protected cerrarDetalle(): void {
    this.detalleReq.set(null);
  }

  async ngOnInit(): Promise<void> {
    try {
      const todos = await firstValueFrom(this.service.obtenerProveedores());
      const proveedores = (todos ?? []).filter((p) => PROVEEDORES_VISIBLES.has((p.nombre ?? '').toUpperCase()));
      this.proveedores.set(proveedores);
      if (proveedores.length) {
        this.proveedorId.set(proveedores[0].id);
        await this.cargar();
      } else {
        this.errorMessage.set('No hay proveedores disponibles para tu usuario.');
      }
    } catch {
      this.errorMessage.set('No se pudieron cargar los proveedores.');
    }
  }

  protected onProveedorChange(id: number): void {
    if (id === this.proveedorId()) return;
    this.proveedorId.set(id);
    this.zonaSel.set('total');
    void this.cargar();
  }

  protected onVistaChange(v: Vista): void {
    this.vista.set(v);
  }

  protected onPeriodoChange(p: MetricsPeriodo): void {
    if (p === this.periodo()) return;
    this.periodo.set(p);
    if (p !== 'dia') {
      this.dia.set(null);
      this.hasta.set(null);
    } else {
      // Volver a "Hoy" reancla en el día actual (no dejar el rango vacío → mes en curso).
      this.dia.set(localToday());
      this.hasta.set(null);
    }
    void this.cargar();
  }

  protected onRangoChange(rango: MetricsRango): void {
    if (this.dia() === rango.desde && this.hasta() === rango.hasta && this.periodo() === 'dia') return;
    this.periodo.set('dia');
    this.dia.set(rango.desde);
    this.hasta.set(rango.hasta);
    void this.cargar();
  }

  protected onZonaSel(z: ZonaSel): void {
    this.zonaSel.set(z);
  }

  protected async recargar(): Promise<void> {
    await this.cargar();
  }

  private async cargar(): Promise<void> {
    const idProveedor = this.proveedorId();
    if (idProveedor === null) return;
    this.isLoading.set(true);
    this.errorMessage.set('');
    const range = resolveMetricsRange(this.periodo(), this.dia(), this.hasta());
    try {
      const [dashboard, tramos] = await Promise.all([
        firstValueFrom(this.service.obtenerDashboard(idProveedor, range.desde, range.hasta)),
        firstValueFrom(this.service.obtenerTramos(idProveedor))
      ]);
      this.data.set(dashboard);
      this.tramos.set(tramos);
    } catch {
      this.errorMessage.set('No se pudieron cargar las métricas de venta.');
      this.data.set(null);
      this.tramos.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }

  private pct(num: number, den: number): number {
    if (!den) return 0;
    return Math.round((num / den) * 1000) / 10;
  }

  private w(num: number, den: number): number {
    if (!den) return 0;
    return Math.min(100, Math.round((num / den) * 100));
  }

  private subtipLabel(codigo: string | null): string {
    if (!codigo) return 'Sin subtipificación';
    return codigo
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase());
  }

  private hhmm(hora: string | null): string {
    return hora ? hora.slice(0, 5) : '';
  }

  private iniciales(nombre: string): string {
    const partes = nombre.trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return '?';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }
}
