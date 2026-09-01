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
import { MetricsRango, resolveMetricsRange } from '../../../../shared/utils/metrics-period';
import { SessionService } from '../../../../core/services/session.service';
import {
  DashboardVentaResponse,
  DashboardVentaService,
  DashboardVentaTramosResponse,
  MetricaVentaDetalle,
  ProveedorRef,
  VentaAsesorDetalle,
  VentaResumenDetalle
} from '../../services/dashboard-venta.service';
import {
  DashboardVentaDetalleModalComponent,
  DetalleColumna
} from '../dashboard-venta-detalle-modal/dashboard-venta-detalle-modal.component';

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
}

interface EstadoVm {
  label: string;
  color: string;
  cantidad: number;
  pct: number;
  width: number;
}

interface ZonaRowVm {
  label: string;
  hint?: string;
  lima: number;
  provincia: number;
  total: number;
}

interface ProgRowVm {
  label: string;
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
const PROVEEDOR_ACCENT: Record<string, string> = { CLARO: '#c8384b', WIN: '#3457d5' };
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
    DashboardVentaDetalleModalComponent
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
  protected readonly periodo = signal<MetricsPeriodo>('mes');
  protected readonly dia = signal<string | null>(null);
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
    return this.dia() ?? 'Hoy';
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
      { key: 'preventas', label: 'Preventas', value: c.preventasCompletas, color: 'primary', width: 100, nota: 'Preventas completas', tone: '' },
      { key: 'registradas', label: 'Registradas', value: c.ventasRegistradas, color: 'info', width: this.w(c.ventasRegistradas, base), nota: 'Ventas validadas', tone: '' },
      { key: 'programadas', label: 'Programadas', value: c.programadasTotal, color: 'secondary', width: this.w(c.programadasTotal, base), nota: 'Ventas programadas', tone: '' },
      { key: 'rechazadas', label: 'Rechazadas', value: c.ventasRechazadas, color: 'danger', width: this.w(c.ventasRechazadas, base), nota: 'Ventas rechazadas', tone: 'bad' },
      { key: 'instaladas', label: 'Instaladas', value: c.ventasInstaladas, color: 'success', width: this.w(c.ventasInstaladas, base), nota: 'Ventas instaladas', tone: 'good' }
    ];
  });

  protected readonly conversiones = computed<ConversionVm[]>(() => {
    const c = this.data()?.contadores;
    if (!c) return [];
    return [
      { label: 'Preventas → Registradas', pct: this.pct(c.ventasRegistradas, c.preventasCompletas), frac: `${c.ventasRegistradas}/${c.preventasCompletas}` },
      { label: 'Preventas → Instaladas', pct: this.pct(c.ventasInstaladas, c.preventasCompletas), frac: `${c.ventasInstaladas}/${c.preventasCompletas}` },
      { label: 'Registradas → Instaladas', pct: this.pct(c.ventasInstaladas, c.ventasRegistradas), frac: `${c.ventasInstaladas}/${c.ventasRegistradas}` },
      { label: 'Preventas → Rechazadas', pct: this.pct(c.ventasRechazadas, c.preventasCompletas), frac: `${c.ventasRechazadas}/${c.preventasCompletas}` },
      { label: 'Programadas → Instaladas', pct: this.pct(c.programadasInstaladas, c.programadasTotal), frac: `${c.programadasInstaladas}/${c.programadasTotal}` },
      { label: 'Programadas → Rechazadas', pct: this.pct(c.programadasRechazadas, c.programadasTotal), frac: `${c.programadasRechazadas}/${c.programadasTotal}` }
    ];
  });

  // ── Estado por tipificación ──────────────────────────────────────────────────────────────────
  protected readonly estadoRows = computed<EstadoVm[]>(() => {
    const d = this.data();
    if (!d) return [];
    const total = d.contadores.preventasCompletas || 1;
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
          orden: meta.orden
        };
      })
      .sort((a, b) => a.orden - b.orden);
  });

  // ── Zonas + cargo fijo ───────────────────────────────────────────────────────────────────────
  protected readonly zonaRows = computed<ZonaRowVm[]>(() => {
    const z = this.data()?.zonas;
    if (!z) return [];
    return [
      { label: 'Registradas', lima: z.lima.registradas, provincia: z.provincia.registradas, total: z.lima.registradas + z.provincia.registradas },
      { label: 'Instaladas', lima: z.lima.instaladas, provincia: z.provincia.instaladas, total: z.lima.instaladas + z.provincia.instaladas },
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
      .map((s) => ({ label: this.subtipLabel(s.codigo), cantidad: s.cantidad, width: this.w(s.cantidad, max) }));
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

  // ── Modales de detalle (drill-down) ──────────────────────────────────────────────────────────
  protected readonly colsAsesor: DetalleColumna[] = [
    { header: 'Lead', kind: 'stack', primary: 'lead', secondary: 'usermeta', prefixSecondary: '@', emphasis: true },
    { header: 'Documento', kind: 'text', field: 'numeroDocumento' },
    { header: 'Nombre', kind: 'text', field: 'nombreCliente', truncate: true },
    { header: 'Etapa', kind: 'text', field: 'etapa' },
    { header: 'Tipificación', kind: 'stack', primary: 'tipificacion', secondary: 'subtipificacion', truncate: true },
    { header: 'Coment.', kind: 'comment', field: 'ultimoComentario' }
  ];
  protected readonly colsResumen: DetalleColumna[] = [
    { header: 'Fecha registro', kind: 'datetime', field: 'fechaRegistro' },
    { header: 'Cliente', kind: 'stack', primary: 'numeroDocumento', secondary: 'lead', emphasis: true },
    { header: 'Nombre', kind: 'text', field: 'nombreCliente', truncate: true },
    { header: 'Tipificación', kind: 'stack', primary: 'tipificacion', secondary: 'subtipificacion', truncate: true },
    { header: 'Última gestión', kind: 'datetime', field: 'fechaUltimaGestion' },
    { header: 'Días', kind: 'dias', fromField: 'fechaRegistro', toField: 'fechaUltimaGestion' }
  ];
  private readonly metricaPorKey: Record<string, MetricaVentaDetalle> = {
    preventas: 'PREVENTAS',
    registradas: 'REGISTRADAS',
    programadas: 'PROGRAMADAS',
    rechazadas: 'RECHAZADAS',
    instaladas: 'INSTALADAS'
  };
  private readonly metricaLabel: Record<MetricaVentaDetalle, string> = {
    PREVENTAS: 'Preventas',
    REGISTRADAS: 'Registradas',
    PROGRAMADAS: 'Programadas',
    RECHAZADAS: 'Rechazadas',
    INSTALADAS: 'Instaladas'
  };

  // Asesor
  protected readonly detAsesorVisible = signal(false);
  protected readonly detAsesorLoading = signal(false);
  protected readonly detAsesorError = signal(false);
  protected readonly detAsesorCtx = signal('');
  protected readonly detAsesorPage = signal(0);
  protected readonly detAsesorTotal = signal(0);
  private readonly detAsesorRows = signal<VentaAsesorDetalle[]>([]);
  protected readonly detAsesorRowsView = computed(
    () => this.detAsesorRows() as unknown as Record<string, unknown>[]
  );
  private detAsesorId: number | null = null;

  // Resumen
  protected readonly detResumenVisible = signal(false);
  protected readonly detResumenLoading = signal(false);
  protected readonly detResumenError = signal(false);
  protected readonly detResumenTitle = signal('');
  protected readonly detResumenCtx = signal('');
  protected readonly detResumenPage = signal(0);
  protected readonly detResumenTotal = signal(0);
  private readonly detResumenRows = signal<VentaResumenDetalle[]>([]);
  protected readonly detResumenRowsView = computed(
    () => this.detResumenRows() as unknown as Record<string, unknown>[]
  );
  private detResumenMetrica: MetricaVentaDetalle | null = null;

  protected readonly pageSize = 25;

  protected abrirDetalleAsesor(a: RankingVm): void {
    this.detAsesorId = a.idAsesor;
    this.detAsesorCtx.set(`${this.proveedorNombre()} · ${a.nombre} · ${this.periodoLabel()}`);
    this.detAsesorPage.set(0);
    this.detAsesorVisible.set(true);
    void this.cargarDetAsesor();
  }

  protected onDetAsesorPage(page: number): void {
    this.detAsesorPage.set(page);
    void this.cargarDetAsesor();
  }

  private async cargarDetAsesor(): Promise<void> {
    const idProveedor = this.proveedorId();
    const idAsesor = this.detAsesorId;
    if (idProveedor === null || idAsesor === null) return;
    this.detAsesorLoading.set(true);
    this.detAsesorError.set(false);
    const range = resolveMetricsRange(this.periodo(), this.dia(), this.hasta());
    try {
      const resp = await firstValueFrom(
        this.service.obtenerAsesoresDetalle(idProveedor, idAsesor, range.desde, range.hasta, this.detAsesorPage(), this.pageSize)
      );
      this.detAsesorRows.set(resp.content);
      this.detAsesorTotal.set(resp.totalElements);
    } catch {
      this.detAsesorError.set(true);
      this.detAsesorRows.set([]);
    } finally {
      this.detAsesorLoading.set(false);
    }
  }

  protected abrirDetalleResumen(key: string): void {
    const metrica = this.metricaPorKey[key];
    if (!metrica) return;
    this.detResumenMetrica = metrica;
    this.detResumenTitle.set(this.metricaLabel[metrica]);
    this.detResumenCtx.set(`${this.proveedorNombre()} · ${this.metricaLabel[metrica]} · ${this.periodoLabel()}`);
    this.detResumenPage.set(0);
    this.detResumenVisible.set(true);
    void this.cargarDetResumen();
  }

  protected onDetResumenPage(page: number): void {
    this.detResumenPage.set(page);
    void this.cargarDetResumen();
  }

  private async cargarDetResumen(): Promise<void> {
    const idProveedor = this.proveedorId();
    const metrica = this.detResumenMetrica;
    if (idProveedor === null || metrica === null) return;
    this.detResumenLoading.set(true);
    this.detResumenError.set(false);
    const range = resolveMetricsRange(this.periodo(), this.dia(), this.hasta());
    try {
      const resp = await firstValueFrom(
        this.service.obtenerResumenDetalle(idProveedor, metrica, range.desde, range.hasta, this.detResumenPage(), this.pageSize)
      );
      this.detResumenRows.set(resp.content);
      this.detResumenTotal.set(resp.totalElements);
    } catch {
      this.detResumenError.set(true);
      this.detResumenRows.set([]);
    } finally {
      this.detResumenLoading.set(false);
    }
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
