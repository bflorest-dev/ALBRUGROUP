import { Injectable, OnDestroy, computed, effect, inject, signal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Subscription, catchError, filter, forkJoin, map, of, startWith, switchMap, throttleTime } from 'rxjs';
import { CurrentUserTeamScopeService } from '../../../core/services/current-user-team-scope.service';
import { SessionService } from '../../../core/services/session.service';
import { resolveMetricsRange } from '../../../shared/utils/metrics-period';
import { MetricsPeriodo } from '../../../shared/components/period-selector/period-selector.component';
import { LeadRealtimeService } from '../../preventa/services/lead-realtime.service';
import { AdminEquipoService } from '../services/admin-equipo.service';
import {
  VentaSeguimientoAsesor,
  VentaSeguimientoCeldaTipi,
  VentaSeguimientoContadores,
  VentaSeguimientoDetalle,
  VentaSeguimientoEquipoInfo,
  VentaSeguimientoResponse,
  VentaSeguimientoService
} from '../services/venta-seguimiento.service';

/** Eventos que sí mueven contadores de VENTA; el resto no debe gatillar recarga. */
const EVENTOS_RELEVANTES = new Set(['REGISTRO', 'REGISTRO_MASIVO', 'ASIGNACION', 'TIPIFICACION']);

/** Buckets especiales (no son códigos de la matriz): fuera del orden por `orden`. */
export const BUCKET_RETORNO = 'RETORNO';
export const BUCKET_SIN_GESTIONAR = 'SIN_GESTIONAR';

/** Metadatos de presentación por estado: etiqueta legible + color semántico. */
export interface EstadoMeta {
  label: string;
  color: string;
}

const ESTADO_META: Record<string, EstadoMeta> = {
  INSTALADO: { label: 'Instalado', color: '#3fd199' },
  PROGRAMADO: { label: 'Programado', color: '#4bb6d8' },
  INGRESADO: { label: 'Ingresado', color: '#86d69f' },
  'SIN INGRESAR': { label: 'Sin ingresar', color: '#e8a857' },
  SUBSANABLE: { label: 'Subsanable', color: '#e07f4c' },
  'NO RECUPERABLE': { label: 'No recuperable', color: '#d6564f' },
  [BUCKET_SIN_GESTIONAR]: { label: 'Sin gestionar', color: '#8d8272' },
  [BUCKET_RETORNO]: { label: 'Retorno a preventa', color: '#9b8fd1' }
};

const ESTADO_FALLBACK: EstadoMeta = { label: '—', color: '#8d8272' };

/** Orden de despliegue del embudo/distribución (instalado arriba → problemas → especiales al final). */
const DISPLAY_ORDER = [
  'INSTALADO', 'PROGRAMADO', 'INGRESADO', 'SIN INGRESAR', 'SUBSANABLE', 'NO RECUPERABLE',
  BUCKET_SIN_GESTIONAR, BUCKET_RETORNO
];

export function estadoMeta(clave: string | null): EstadoMeta {
  return (clave && ESTADO_META[clave]) || ESTADO_FALLBACK;
}

/** Celda de tipificación con etiqueta + color ya resueltos y % sobre el total de ingresadas. */
export interface CeldaTipiVista extends VentaSeguimientoCeldaTipi {
  label: string;
  color: string;
  porcentaje: number;
}

/** Fila de asesor con sus celdas ordenadas (para las barras apiladas). */
export interface AsesorVista {
  key: string;
  idAsesor: number | null;
  nombreAsesor: string;
  total: number;
  celdas: CeldaTipiVista[];
}

/** Contadores + los 3 porcentajes derivados (conversión y las dos efectividades). */
export interface ContadoresVista extends VentaSeguimientoContadores {
  conversion: number; // subidas / ingresadas
  efectividadOperador: number; // instaladas / subidas
  efectividadAgencia: number; // instaladas / ingresadas
}

type Criteria = {
  requestId: number;
  idEquipo: number | null;
  idProveedor: number | null;
  desde?: string;
  hasta?: string;
};

type LoadResult = {
  resumen: VentaSeguimientoResponse;
  equipoInfo: VentaSeguimientoEquipoInfo;
};

type State =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number }
  | { status: 'success'; requestId: number; data: LoadResult }
  | { status: 'error'; requestId: number };

@Injectable()
export class VentaSeguimientoFacade implements OnDestroy {
  private readonly service = inject(VentaSeguimientoService);
  private readonly equipoService = inject(AdminEquipoService);
  private readonly realtimeService = inject(LeadRealtimeService);
  private readonly sessionService = inject(SessionService);
  private readonly teamScope = inject(CurrentUserTeamScopeService);
  private readonly realtimeSubscription = new Subscription();

  private requestId = 0;
  private started = false;
  private readonly criteria = signal<Criteria | null>(null);

  readonly periodo = signal<MetricsPeriodo>('dia');
  readonly diaSeleccionado = signal<string | null>(null);
  readonly hastaSeleccionado = signal<string | null>(null);
  readonly idEquipo = signal<number | null>(null);
  readonly idProveedor = signal<number | null>(null);

  private readonly state = toSignal(
    toObservable(this.criteria).pipe(
      switchMap((criteria) => {
        if (!criteria) {
          return of<State>({ status: 'idle' });
        }
        return forkJoin({
          resumen: this.service.obtenerResumenDiario(
            criteria.idEquipo,
            criteria.idProveedor,
            criteria.desde,
            criteria.hasta
          ),
          equipos: this.shouldUseVisibleTeamsCatalog()
            ? this.equipoService.listarMisEquipos()
            : this.equipoService.listarEquipos()
        }).pipe(
          map(({ resumen, equipos }): State => {
            const equipo = equipos.find((item) => item.id === criteria.idEquipo);
            return {
              status: 'success',
              requestId: criteria.requestId,
              data: {
                resumen,
                equipoInfo: {
                  idEquipo: criteria.idEquipo,
                  nombre:
                    equipo?.nombre ??
                    (criteria.idEquipo == null ? 'Todos los equipos' : `Equipo ${criteria.idEquipo}`),
                  color: equipo?.color ?? null
                }
              }
            };
          }),
          startWith<State>({ status: 'loading', requestId: criteria.requestId }),
          catchError(() => of<State>({ status: 'error', requestId: criteria.requestId }))
        );
      })
    ),
    { initialValue: { status: 'idle' } as State }
  );

  /** Último resultado exitoso: el poster nunca queda en blanco mientras revalida (stale-while-revalidate). */
  private readonly lastData = signal<LoadResult | null>(null);
  private readonly switching = signal(false);
  private readonly data = computed<LoadResult | null>(() => this.lastData());

  readonly isInitialLoading = computed(() => {
    const status = this.state().status;
    return this.lastData() === null && (status === 'loading' || status === 'idle');
  });
  readonly isSwitching = computed(() => this.switching() && this.lastData() !== null);
  readonly isRefreshing = computed(
    () => this.state().status === 'loading' && this.lastData() !== null && !this.switching()
  );
  readonly showErrorPlaceholder = computed(() => this.state().status === 'error' && this.lastData() === null);

  readonly equipoInfo = computed<VentaSeguimientoEquipoInfo | null>(() => this.data()?.equipoInfo ?? null);

  readonly contadores = computed<ContadoresVista>(() => {
    const c = this.data()?.resumen.contadores ?? { ingresadas: 0, subidas: 0, instaladas: 0 };
    return {
      ...c,
      conversion: c.ingresadas > 0 ? (c.subidas / c.ingresadas) * 100 : 0,
      efectividadOperador: c.subidas > 0 ? (c.instaladas / c.subidas) * 100 : 0,
      efectividadAgencia: c.ingresadas > 0 ? (c.instaladas / c.ingresadas) * 100 : 0
    };
  });

  /** Distribución por tipificación, ordenada para el embudo/barras y con label+color+%. */
  readonly tipificaciones = computed<CeldaTipiVista[]>(() => {
    const ingresadas = this.data()?.resumen.contadores.ingresadas ?? 0;
    const celdas = this.data()?.resumen.tipificaciones ?? [];
    return celdas.map((celda) => this.toCeldaVista(celda, ingresadas)).sort(compararPorDisplay);
  });

  /** Máxima cantidad de la distribución, para escalar las barras (mínimo 1). */
  readonly maxTipiCantidad = computed<number>(() =>
    Math.max(1, ...this.tipificaciones().map((celda) => celda.cantidad))
  );

  readonly porAsesor = computed<AsesorVista[]>(() =>
    (this.data()?.resumen.porAsesor ?? []).map((asesor) => this.toAsesorVista(asesor))
  );

  readonly detalle = computed<VentaSeguimientoDetalle[]>(() => this.data()?.resumen.detalle ?? []);

  readonly isEmpty = computed(() => {
    const data = this.data();
    return !!data && data.resumen.contadores.ingresadas === 0;
  });

  constructor() {
    effect(() => {
      const state = this.state();
      if (state.status === 'success') {
        untracked(() => {
          this.lastData.set(state.data);
          this.switching.set(false);
          this.service.guardarCache(this.cacheKey(), state.data);
        });
      } else if (state.status === 'error') {
        untracked(() => this.switching.set(false));
      }
    });
    this.startRealtime();
  }

  ngOnDestroy(): void {
    this.realtimeSubscription.unsubscribe();
  }

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    this.reload();
  }

  setPeriodo(periodo: MetricsPeriodo | null | undefined): void {
    if (!periodo || this.periodo() === periodo) {
      return;
    }
    this.periodo.set(periodo);
    if (periodo !== 'dia') {
      this.diaSeleccionado.set(null);
      this.hastaSeleccionado.set(null);
    }
    this.reload(true);
  }

  setRango(desde: string, hasta: string): void {
    if (!desde) {
      return;
    }
    if (this.diaSeleccionado() === desde && this.hastaSeleccionado() === hasta && this.periodo() === 'dia') {
      return;
    }
    this.diaSeleccionado.set(desde);
    this.hastaSeleccionado.set(hasta);
    this.periodo.set('dia');
    this.reload(true);
  }

  setIdEquipo(idEquipo: number | null | undefined): void {
    const normalized = idEquipo ?? null;
    if (this.idEquipo() === normalized) {
      return;
    }
    this.idEquipo.set(normalized);
    this.reload(true);
  }

  setIdProveedor(idProveedor: number | null | undefined): void {
    const normalized = idProveedor ?? null;
    if (this.idProveedor() === normalized) {
      return;
    }
    this.idProveedor.set(normalized);
    this.reload(true);
  }

  reload(userInitiated = false): void {
    if (!this.started) {
      return;
    }
    const cacheado = this.service.leerCache(this.cacheKey());
    if (cacheado) {
      this.lastData.set(cacheado);
      this.switching.set(false);
    } else if (userInitiated) {
      this.switching.set(true);
    }
    const range = resolveMetricsRange(this.periodo(), this.diaSeleccionado(), this.hastaSeleccionado());
    this.criteria.set({
      requestId: ++this.requestId,
      idEquipo: this.idEquipo(),
      idProveedor: this.idProveedor(),
      desde: range.desde,
      hasta: range.hasta
    });
  }

  private cacheKey(): string {
    return [
      this.idEquipo(),
      this.idProveedor(),
      this.periodo(),
      this.diaSeleccionado() ?? '',
      this.hastaSeleccionado() ?? ''
    ].join('|');
  }

  private shouldUseVisibleTeamsCatalog(): boolean {
    return this.teamScope.isDashboardTeamScoped() || this.sessionService.getPrimaryRole() === 'COMMUNITY';
  }

  private startRealtime(): void {
    this.realtimeSubscription.add(
      this.realtimeService
        .watchTopic('/topic/leads/etapa/VENTA')
        .pipe(
          filter((event) => EVENTOS_RELEVANTES.has(event.tipo)),
          throttleTime(20000, undefined, { leading: false, trailing: true })
        )
        .subscribe({
          next: () => {
            if (this.started) {
              this.reload();
            }
          },
          error: () => undefined
        })
    );
  }

  private toCeldaVista(celda: VentaSeguimientoCeldaTipi, ingresadas: number): CeldaTipiVista {
    const meta = estadoMeta(celda.clave);
    return {
      ...celda,
      label: meta.label,
      color: meta.color,
      porcentaje: ingresadas > 0 ? (celda.cantidad / ingresadas) * 100 : 0
    };
  }

  private toAsesorVista(asesor: VentaSeguimientoAsesor): AsesorVista {
    const celdas = asesor.celdas
      .map((celda) => this.toCeldaVista(celda, asesor.total))
      .sort(compararPorDisplay);
    return {
      key: asesor.idAsesor == null ? `na-${asesor.nombreAsesor ?? ''}` : String(asesor.idAsesor),
      idAsesor: asesor.idAsesor,
      nombreAsesor: asesor.nombreAsesor ?? 'Sin mérito',
      total: asesor.total,
      celdas
    };
  }
}

function displayRank(clave: string): number {
  const index = DISPLAY_ORDER.indexOf(clave);
  return index === -1 ? DISPLAY_ORDER.length : index;
}

function compararPorDisplay(a: VentaSeguimientoCeldaTipi, b: VentaSeguimientoCeldaTipi): number {
  return displayRank(a.clave) - displayRank(b.clave);
}
