import { Injectable, OnDestroy, computed, effect, inject, signal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Subscription, catchError, filter, forkJoin, map, of, startWith, switchMap, throttleTime } from 'rxjs';
import { CurrentUserTeamScopeService } from '../../../core/services/current-user-team-scope.service';
import { SessionService } from '../../../core/services/session.service';
import { resolveMetricsRange } from '../../../shared/utils/metrics-period';
import { MetricsPeriodo } from '../../../shared/components/period-selector/period-selector.component';
import { LeadRealtimeService } from '../../preventa/services/lead-realtime.service';
import { AdminEquipoService } from '../services/admin-equipo.service';
import { GestionCampoTipi, GestionModo } from '../services/admin-gestion-campana.service';
import {
  ResumenAsesor,
  ResumenDiarioResponse,
  ResumenDiarioService,
  ResumenIngresosGestion,
  ResumenSubtipCampanaCelda
} from '../services/resumen-diario.service';

/**
 * Únicos tipos de evento que pueden mover los contadores del resumen: ingreso de leads, asignación a
 * asesores y tipificación. El resto (actualizar datos, iniciar gestión, contacto, cerrar atención…)
 * no cambia ningún agregado, así que no debe gatillar una recarga.
 */
const EVENTOS_RELEVANTES = new Set(['REGISTRO', 'REGISTRO_MASIVO', 'ASIGNACION', 'TIPIFICACION']);

const SIN_TIPIFICAR_CODIGO = 'SIN_TIPIFICAR';
const SIN_TIPIFICAR_LABEL = '0 - Sin tipificar';
const SIN_CAMPANA = 'Sin campaña';

/** Encabezado del poster: equipo y su color de marca. */
export interface ResumenEquipoInfo {
  idEquipo: number | null;
  nombre: string;
  color: string | null;
}

/** Fila del ranking con el % de preventa sobre las asignaciones (autocalc). */
export interface ResumenAsesorVista extends ResumenAsesor {
  key: string;
}

/** Tabla 1 con porcentajes derivados. */
export interface ResumenIngresosGestionVista extends ResumenIngresosGestion {
  ingresosPct: number;
  gestionPct: number;
}

/** Fila de la tabla 3 (estado leads) con label "N - Nombre" y % ya provisto por el backend. */
export interface ResumenEstadoFila {
  key: string;
  label: string;
  cantidad: number;
  porcentaje: number;
  esPreventa: boolean;
}

/** Columna (campaña) del pivote de la tabla 4. */
export interface ResumenCampanaColumn {
  key: string;
  nombre: string;
  total: number;
}

/** Celda del pivote: cantidad + % sobre el total de la campaña. */
export interface ResumenSubtipCelda {
  key: string;
  cantidad: number;
  porcentaje: number;
}

/** Fila del pivote: una subtipificación con su total y sus celdas alineadas a las columnas. */
export interface ResumenSubtipFila {
  key: string;
  label: string;
  total: number;
  celdas: ResumenSubtipCelda[];
}

export interface ResumenCampanaPivot {
  columnas: ResumenCampanaColumn[];
  filas: ResumenSubtipFila[];
}

const CIERRE_TIPIFICACION = 'PREVENTA';

type Criteria = {
  requestId: number;
  idEquipo: number | null;
  modo: GestionModo;
  campo: GestionCampoTipi;
  desde?: string;
  hasta?: string;
};

type LoadResult = {
  resumen: ResumenDiarioResponse;
  equipoInfo: ResumenEquipoInfo;
};

type State =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number }
  | { status: 'success'; requestId: number; data: LoadResult }
  | { status: 'error'; requestId: number };

@Injectable()
export class ResumenDiarioFacade implements OnDestroy {
  private readonly service = inject(ResumenDiarioService);
  private readonly equipoService = inject(AdminEquipoService);
  private readonly realtimeService = inject(LeadRealtimeService);
  private readonly sessionService = inject(SessionService);
  private readonly teamScope = inject(CurrentUserTeamScopeService);
  private readonly realtimeSubscription = new Subscription();

  private requestId = 0;
  private started = false;
  private readonly criteria = signal<Criteria | null>(null);

  readonly campo = signal<GestionCampoTipi>('MAYOR');
  readonly modo = signal<GestionModo>('GESTIONADOS');
  readonly periodo = signal<MetricsPeriodo>('dia');
  readonly diaSeleccionado = signal<string | null>(null);
  readonly hastaSeleccionado = signal<string | null>(null);
  readonly idEquipo = signal<number | null>(null);

  private readonly state = toSignal(
    toObservable(this.criteria).pipe(
      switchMap((criteria) => {
        if (!criteria) {
          return of<State>({ status: 'idle' });
        }
        return forkJoin({
          resumen: this.service.obtenerResumenDiario(
            criteria.idEquipo,
            criteria.modo,
            criteria.campo,
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
                  nombre: equipo?.nombre ?? (criteria.idEquipo == null ? 'Todos los equipos' : `Equipo ${criteria.idEquipo}`),
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

  /**
   * Último resultado exitoso. Persiste entre recargas para que el poster nunca quede en blanco:
   * mientras se busca el nuevo resumen se sigue mostrando el anterior, y se intercambia recién
   * cuando llega el nuevo (stale-while-revalidate). Vale también al alternar de equipo.
   */
  private readonly lastData = signal<LoadResult | null>(null);
  /** true mientras una recarga iniciada por el usuario (cambio de equipo/filtro) está en vuelo. */
  private readonly switching = signal(false);

  private readonly data = computed<LoadResult | null>(() => this.lastData());

  /** Placeholder de carga solo en la PRIMERA carga (sin datos previos). */
  readonly isInitialLoading = computed(() => {
    const status = this.state().status;
    return this.lastData() === null && (status === 'loading' || status === 'idle');
  });

  /**
   * Cambio de contexto (equipo/filtro) en vuelo: se conserva el reporte anterior visible pero
   * DIFUMINADO hasta que llega el nuevo, en vez de desaparecerlo con un "Cargando".
   */
  readonly isSwitching = computed(() => this.switching() && this.lastData() !== null);

  /** Recarga de fondo (websocket): indicador sutil, sin difuminar. */
  readonly isRefreshing = computed(
    () => this.state().status === 'loading' && this.lastData() !== null && !this.switching()
  );

  /** Error a pantalla completa solo si aún no hay ningún reporte que preservar. */
  readonly showErrorPlaceholder = computed(() => this.state().status === 'error' && this.lastData() === null);

  readonly equipoInfo = computed<ResumenEquipoInfo | null>(() => this.data()?.equipoInfo ?? null);

  readonly ingresosGestion = computed<ResumenIngresosGestionVista | null>(() => {
    const ig = this.data()?.resumen.ingresosGestion;
    if (!ig) {
      return null;
    }
    return {
      ...ig,
      ingresosPct: ig.ingresosTotal > 0 ? (ig.ingresosPreventas / ig.ingresosTotal) * 100 : 0,
      gestionPct: ig.gestionTotal > 0 ? (ig.gestionPreventas / ig.gestionTotal) * 100 : 0
    };
  });

  readonly totalPreventas = computed<number>(() => this.data()?.resumen.ranking.totalPreventas ?? 0);

  readonly ranking = computed<ResumenAsesorVista[]>(() => {
    const asesores = this.data()?.resumen.ranking.asesores ?? [];
    return asesores.map((asesor) => ({
      ...asesor,
      key: asesor.idAsesor == null ? `ojt-${asesor.nombreAsesor}` : String(asesor.idAsesor)
    }));
  });

  /** Mapa código de tipificación → orden, derivado de las celdas de la tabla 4 (sin fetch extra). */
  private readonly ordenPorCodigo = computed<Map<string, number>>(() => {
    const mapa = new Map<string, number>();
    for (const celda of this.data()?.resumen.gestionCampana ?? []) {
      if (celda.codigoTipificacion && celda.ordenTipificacion != null) {
        mapa.set(celda.codigoTipificacion, celda.ordenTipificacion);
      }
    }
    return mapa;
  });

  readonly estadoLeads = computed<ResumenEstadoFila[]>(() => {
    const orden = this.ordenPorCodigo();
    return (this.data()?.resumen.estadoLeads ?? []).map((fila) => {
      const codigo = fila.codigoTipificacion;
      const esSinTipificar = codigo === SIN_TIPIFICAR_CODIGO;
      const ordenTipi = orden.get(codigo);
      const label = esSinTipificar
        ? SIN_TIPIFICAR_LABEL
        : ordenTipi != null
          ? `${ordenTipi} - ${this.capitalizar(codigo)}`
          : this.capitalizar(codigo);
      return {
        key: codigo,
        label,
        cantidad: fila.cantidad,
        porcentaje: fila.porcentaje,
        esPreventa: codigo === CIERRE_TIPIFICACION
      };
    });
  });

  /** Mayor cantidad de la tabla 3, para escalar las mini-barras (mínimo 1 para no dividir por cero). */
  readonly maxEstadoCantidad = computed<number>(() =>
    Math.max(1, ...this.estadoLeads().map((fila) => fila.cantidad))
  );

  readonly gestionCampana = computed<ResumenCampanaPivot>(() => {
    const celdas = this.data()?.resumen.gestionCampana ?? [];
    return this.pivotar(celdas);
  });

  readonly isEmpty = computed(() => {
    const data = this.data();
    if (!data) {
      return false;
    }
    const r = data.resumen;
    return (
      r.ingresosGestion.ingresosTotal === 0 &&
      r.ingresosGestion.gestionTotal === 0 &&
      r.ranking.asesores.length === 0 &&
      r.estadoLeads.length === 0 &&
      r.gestionCampana.length === 0
    );
  });

  constructor() {
    // Fija el último resultado exitoso; los view models leen de aquí, no del estado en vuelo.
    effect(() => {
      const state = this.state();
      if (state.status === 'success') {
        untracked(() => {
          this.lastData.set(state.data);
          this.switching.set(false);
          // Persiste en la caché root para mostrarlo al instante al volver al tab.
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

  setModo(modo: GestionModo | null | undefined): void {
    if (!modo || this.modo() === modo) {
      return;
    }
    this.modo.set(modo);
    this.reload(true);
  }

  setCampo(campo: GestionCampoTipi | null | undefined): void {
    if (!campo || this.campo() === campo) {
      return;
    }
    this.campo.set(campo);
    this.reload(true);
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

  /** Un dia suelto llega como `desde === hasta`; un rango, con `hasta` distinto. */
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

  /**
   * @param userInitiated cuando la recarga la origina el usuario (cambió equipo/modo/campo/período)
   *   se conserva el reporte anterior visible y se marca {@link switching} para difuminarlo hasta que
   *   llegue el nuevo. El refresco de fondo (websocket) queda `false`: indicador sutil, sin difuminar.
   */
  reload(userInitiated = false): void {
    if (!this.started) {
      return;
    }
    const cacheado = this.service.leerCache(this.cacheKey());
    if (cacheado) {
      // Ya vimos esta combinación (p. ej. al volver de otro tab): se muestra al instante y se
      // revalida en segundo plano, sin "Cargando" ni difuminado.
      this.lastData.set(cacheado);
      this.switching.set(false);
    } else if (userInitiated) {
      // Sin caché y el usuario cambió de contexto: se conserva el anterior difuminado hasta el nuevo.
      this.switching.set(true);
    }
    const range = resolveMetricsRange(this.periodo(), this.diaSeleccionado(), this.hastaSeleccionado());
    this.criteria.set({
      requestId: ++this.requestId,
      idEquipo: this.idEquipo(),
      modo: this.modo(),
      campo: this.campo(),
      desde: range.desde,
      hasta: range.hasta
    });
  }

  /** Clave de caché por combinación de filtros (equipo/modo/campo/período/día/hasta). */
  private cacheKey(): string {
    return [
      this.idEquipo(),
      this.modo(),
      this.campo(),
      this.periodo(),
      this.diaSeleccionado() ?? '',
      this.hastaSeleccionado() ?? ''
    ].join('|');
  }

  private shouldUseVisibleTeamsCatalog(): boolean {
    return this.teamScope.isDashboardTeamScoped() || this.sessionService.getPrimaryRole() === 'COMMUNITY';
  }

  /**
   * En producción los leads cambian de continuo. En vez de recargar en cada evento (machacaría al
   * backend), se refresca como mucho una vez cada 20 s. La recarga es en segundo plano y preserva el
   * reporte anterior (ver {@link lastData}), así que el usuario nunca ve un estado de carga.
   */
  private startRealtime(): void {
    this.realtimeSubscription.add(
      this.realtimeService
        // Topic acotado a PREVENTA: la actividad de otras etapas (venta/postventa/cobranza) no puede
        // mover este resumen, así que no debe gatillar recargas.
        .watchTopic('/topic/leads/etapa/PREVENTA')
        .pipe(
          // Solo los eventos que realmente cambian contadores (ingreso/asignación/tipificación).
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

  /** Pivota las celdas subtip × campaña: columnas por campaña (orden por volumen, Sin campaña al final). */
  private pivotar(celdas: ResumenSubtipCampanaCelda[]): ResumenCampanaPivot {
    const columnasMap = new Map<string, ResumenCampanaColumn>();
    type FilaAcc = { key: string; label: string; total: number; porCampana: Map<string, number> };
    const filasMap = new Map<string, FilaAcc>();

    for (const celda of celdas) {
      const campKey = celda.idCampana == null ? 'sin-campana' : String(celda.idCampana);
      const campNombre = celda.nombreCampana ?? SIN_CAMPANA;
      const columna = columnasMap.get(campKey) ?? { key: campKey, nombre: campNombre, total: 0 };
      columna.total += celda.cantidad;
      columnasMap.set(campKey, columna);

      const subKey = `${celda.codigoTipificacion ?? ''}|${celda.codigoSubtipificacion ?? ''}`;
      const label = this.subtipLabel(celda);
      const fila = filasMap.get(subKey) ?? { key: subKey, label, total: 0, porCampana: new Map() };
      fila.total += celda.cantidad;
      fila.porCampana.set(campKey, (fila.porCampana.get(campKey) ?? 0) + celda.cantidad);
      filasMap.set(subKey, fila);
    }

    const columnas = [...columnasMap.values()].sort((a, b) => {
      if (a.key === 'sin-campana') return 1;
      if (b.key === 'sin-campana') return -1;
      return b.total - a.total;
    });

    const filas: ResumenSubtipFila[] = [...filasMap.values()]
      .sort((a, b) => b.total - a.total)
      .map((fila) => ({
        key: fila.key,
        label: fila.label,
        total: fila.total,
        celdas: columnas.map((columna) => {
          const cantidad = fila.porCampana.get(columna.key) ?? 0;
          return {
            key: columna.key,
            cantidad,
            porcentaje: columna.total > 0 ? (cantidad / columna.total) * 100 : 0
          };
        })
      }));

    return { columnas, filas };
  }

  private subtipLabel(celda: ResumenSubtipCampanaCelda): string {
    const nombre = this.capitalizar(celda.codigoSubtipificacion ?? 'Sin subtipificación');
    return celda.ordenTipificacion != null ? `${celda.ordenTipificacion} - ${nombre}` : nombre;
  }

  /** Los códigos vienen en MAYÚSCULAS; se muestran en sentence case. */
  private capitalizar(texto: string): string {
    const limpio = texto.trim().toLowerCase();
    return limpio.length ? limpio.charAt(0).toUpperCase() + limpio.slice(1) : texto;
  }
}
