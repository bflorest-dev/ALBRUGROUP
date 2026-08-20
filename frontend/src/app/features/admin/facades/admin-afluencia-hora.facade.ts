import { Injectable, OnDestroy, computed, effect, inject, signal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Subscription, catchError, forkJoin, map, of, startWith, switchMap } from 'rxjs';
import { CurrentUserTeamScopeService } from '../../../core/services/current-user-team-scope.service';
import { SessionService } from '../../../core/services/session.service';
import { esEquipoOperativo } from '../../../shared/utils/equipos-operativos';
import { resolveMetricsRange } from '../../../shared/utils/metrics-period';
import { LeadRealtimeService } from '../../preventa/services/lead-realtime.service';
import { AdminEquipoService } from '../services/admin-equipo.service';
import {
  AdminAfluenciaHoraService,
  AfluenciaModo,
  AfluenciaPorHoraCelda
} from '../services/admin-afluencia-hora.service';

const HORA_LABELS = [
  '12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM', '6 AM', '7 AM',
  '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM',
  '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM'
];

const SIN_EQUIPO = 'Sin equipo';
const SIN_CAMPANA = 'Sin campaña';

const BRAND_ACCENTS: Array<{ match: string; accent: string }> = [
  { match: 'claro', accent: '#e53935' },
  { match: 'win', accent: '#fb8c00' },
  { match: 'movistar', accent: '#1e88e5' },
  { match: 'entel', accent: '#3949ab' },
  { match: 'bitel', accent: '#43a047' }
];
const FALLBACK_ACCENTS = ['#5b6cff', '#8e24aa', '#00897b', '#6d4c41', '#546e7a', '#c2185b'];

export interface AfluenciaCampanaColumn {
  key: string;
  idCampana: number | null;
  nombre: string;
  total: number;
}

export interface AfluenciaHoraCelda {
  total: number;
  unicos: number;
  repetidos: number;
}

export interface AfluenciaHoraFila {
  hora: number;
  label: string;
  total: number;
  unicos: number;
  repetidos: number;
  celdas: AfluenciaHoraCelda[];
}

export interface AfluenciaEquipoMatriz {
  idEquipo: number | null;
  nombreEquipo: string;
  accent: string;
  totalEventos: number;
  totalUnicos: number;
  maxCeldaTotal: number;
  campanas: AfluenciaCampanaColumn[];
  filas: AfluenciaHoraFila[];
}

export interface AfluenciaCampanaOption {
  key: string;
  nombre: string;
  nombreEquipo: string;
  total: number;
  activa: boolean;
}

export interface AfluenciaCampanaGroup {
  label: string;
  total: number;
  items: AfluenciaCampanaOption[];
}

type AfluenciaPeriodo = 'dia' | 'semana' | 'mes';
type EquipoOption = { label: string; value: number | null };

type Criteria = { requestId: number; modo: AfluenciaModo; desde?: string; hasta?: string };

type LoadResult = {
  celdas: AfluenciaPorHoraCelda[];
  nombresEquipo: Map<number, string>;
  equipoOptions: EquipoOption[];
};

type State =
  | { status: 'idle' }
  | { status: 'loading' | 'refreshing'; requestId: number }
  | { status: 'success'; requestId: number; data: LoadResult }
  | { status: 'error'; requestId: number };

@Injectable()
export class AdminAfluenciaHoraFacade implements OnDestroy {
  private readonly service = inject(AdminAfluenciaHoraService);
  private readonly equipoService = inject(AdminEquipoService);
  private readonly realtimeService = inject(LeadRealtimeService);
  private readonly sessionService = inject(SessionService);
  private readonly teamScope = inject(CurrentUserTeamScopeService);
  private readonly realtimeSubscription = new Subscription();

  private requestId = 0;
  private started = false;
  private readonly criteria = signal<Criteria | null>(null);

  readonly modo = signal<AfluenciaModo>('INGRESADOS');
  readonly periodo = signal<AfluenciaPeriodo>('dia');
  readonly diaSeleccionado = signal<string | null>(null);
  readonly selectedCampanaKeys = signal<string[]>([]);
  readonly selectedEquipoId = signal<number | null>(null);
  private readonly isEquipoLocked = signal(false);
  private readonly lockedEquipoId = signal<number | null>(null);

  private readonly state = toSignal(
    toObservable(this.criteria).pipe(
      switchMap((criteria) => {
        if (!criteria) {
          return of<State>({ status: 'idle' });
        }
        return forkJoin({
          celdas: this.service.obtenerAfluenciaPorHora(criteria.modo, criteria.desde, criteria.hasta),
          equipos: this.shouldUseVisibleTeamsCatalog() ? this.equipoService.listarMisEquipos() : this.equipoService.listarEquipos()
        }).pipe(
          map(({ celdas, equipos }): State => ({
            status: 'success',
            requestId: criteria.requestId,
            data: {
              celdas,
              nombresEquipo: new Map(equipos.map((equipo) => [equipo.id, equipo.nombre])),
              equipoOptions: equipos
                .filter((equipo) => equipo.activo !== false)
                .filter((equipo) => esEquipoOperativo(equipo.nombre))
                .map((equipo) => ({ label: equipo.nombre, value: equipo.id }))
                .sort((left, right) => left.label.localeCompare(right.label))
            }
          })),
          startWith<State>({ status: 'loading', requestId: criteria.requestId }),
          catchError(() => of<State>({ status: 'error', requestId: criteria.requestId }))
        );
      })
    ),
    { initialValue: { status: 'idle' } as State }
  );

  readonly isLoading = computed(() => {
    const status = this.state().status;
    return status === 'loading' || status === 'idle';
  });
  readonly hasError = computed(() => this.state().status === 'error');

  readonly equipoOptions = computed<EquipoOption[]>(() => {
    const state = this.state();
    if (state.status !== 'success') {
      return [];
    }
    const lockedEquipoId = this.lockedEquipoId();
    if (this.isEquipoLocked()) {
      return state.data.equipoOptions.filter((equipo) => equipo.value === lockedEquipoId);
    }
    return [{ label: 'Todos', value: null }, ...state.data.equipoOptions];
  });

  private aplicoEquipoPorDefecto = false;

  constructor() {
    effect(() => {
      const options = this.equipoOptions();
      if (this.aplicoEquipoPorDefecto) {
        return;
      }
      const lockedEquipoId = this.lockedEquipoId();
      if (this.isEquipoLocked()) {
        if (lockedEquipoId !== null) {
          this.aplicoEquipoPorDefecto = true;
          untracked(() => this.selectedEquipoId.set(lockedEquipoId));
          return;
        }
        const primerEquipo = options.find((opcion) => opcion.value !== null);
        if (primerEquipo) {
          this.aplicoEquipoPorDefecto = true;
          untracked(() => this.selectedEquipoId.set(primerEquipo.value));
        }
        return;
      }
      const primerEquipo = options.find((opcion) => opcion.value !== null);
      if (primerEquipo) {
        this.aplicoEquipoPorDefecto = true;
        untracked(() => this.selectedEquipoId.set(primerEquipo.value));
      }
    });
    this.startRealtime();
  }

  ngOnDestroy(): void {
    this.realtimeSubscription.unsubscribe();
  }

  private readonly accumulated = computed(() => {
    const state = this.state();
    return state.status === 'success' ? this.accumulate(state.data) : [];
  });

  private readonly visibleAccumulated = computed(() => {
    const selectedEquipoId = this.selectedEquipoId();
    if (this.isEquipoLocked() && selectedEquipoId === null) {
      return [];
    }
    if (selectedEquipoId === null) {
      return this.accumulated();
    }
    return this.accumulated().filter((equipo) => equipo.idEquipo === selectedEquipoId);
  });

  readonly campanaGroups = computed<AfluenciaCampanaGroup[]>(() => {
    const keysAsignadas = new Set<string>();
    const groups: AfluenciaCampanaGroup[] = [];

    for (const equipo of this.visibleAccumulated()) {
      const items = equipo.campanas
        .filter((campana) => {
          if (keysAsignadas.has(campana.key)) {
            return false;
          }
          keysAsignadas.add(campana.key);
          return true;
        })
        .map((campana) => ({
          key: campana.key,
          nombre: campana.nombre,
          nombreEquipo: equipo.nombreEquipo,
          total: campana.total,
          activa: campana.total > 0
        }))
        .sort((a, b) => {
          if (a.activa !== b.activa) {
            return a.activa ? -1 : 1;
          }
          return this.compareNombre(a.nombre, SIN_CAMPANA, b.nombre);
        });

      if (items.length) {
        groups.push({
          label: equipo.nombreEquipo,
          total: items.reduce((total, item) => total + item.total, 0),
          items
        });
      }
    }
    return groups;
  });

  readonly campanaOptions = computed<AfluenciaCampanaOption[]>(() =>
    this.campanaGroups().flatMap((group) => group.items)
  );

  readonly matrices = computed<AfluenciaEquipoMatriz[]>(() => {
    const seleccion = new Set(this.selectedCampanaKeys());
    const filtrar = seleccion.size > 0;
    return this.visibleAccumulated()
      .map((equipo) => this.buildMatriz(equipo, filtrar ? seleccion : null))
      .filter((matriz) => matriz.campanas.length > 0);
  });

  readonly isEmpty = computed(() => this.state().status === 'success' && this.matrices().length === 0);
  readonly hasActiveFilter = computed(() => this.selectedCampanaKeys().length > 0);

  readonly modoAyuda = computed(() => {
    if (this.modo() === 'INGRESADOS') {
      return 'Eventos de registro (ingreso de leads) agrupados por hora.';
    }
    return 'Eventos de asignación (gestión de leads) agrupados por hora.';
  });

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    this.reload();
  }

  setModo(modo: AfluenciaModo | null | undefined): void {
    if (!modo || this.modo() === modo) {
      return;
    }
    this.modo.set(modo);
    this.reload();
  }

  setPeriodo(periodo: AfluenciaPeriodo | null | undefined): void {
    if (!periodo || this.periodo() === periodo) {
      return;
    }
    this.periodo.set(periodo);
    if (periodo !== 'dia') {
      this.diaSeleccionado.set(null);
    }
    this.reload();
  }

  setDia(dia: string): void {
    if (!dia || this.diaSeleccionado() === dia) {
      return;
    }
    this.diaSeleccionado.set(dia);
    this.periodo.set('dia');
    this.reload();
  }

  setSelectedCampanas(keys: string[] | null | undefined): void {
    this.selectedCampanaKeys.set(keys ?? []);
  }

  setSelectedEquipoId(idEquipo: number | null | undefined): void {
    const lockedEquipoId = this.lockedEquipoId();
    if (this.isEquipoLocked()) {
      if (this.selectedEquipoId() !== lockedEquipoId) {
        this.selectedEquipoId.set(lockedEquipoId);
        this.selectedCampanaKeys.set([]);
      }
      return;
    }
    const normalized = idEquipo ?? null;
    if (normalized === this.selectedEquipoId()) {
      return;
    }
    this.selectedEquipoId.set(normalized);
    this.selectedCampanaKeys.set([]);
  }

  lockEquipo(idEquipo: number | null): void {
    this.isEquipoLocked.set(true);
    this.lockedEquipoId.set(idEquipo);
    this.aplicoEquipoPorDefecto = idEquipo !== null;
    this.selectedEquipoId.set(idEquipo);
    this.selectedCampanaKeys.set([]);
  }

  clearCampanaFilter(): void {
    this.selectedCampanaKeys.set([]);
  }

  reload(): void {
    const range = resolveMetricsRange(this.periodo(), this.diaSeleccionado());
    this.criteria.set({
      requestId: ++this.requestId,
      modo: this.modo(),
      desde: range.desde,
      hasta: range.hasta
    });
  }

  // ---- internos ----

  private startRealtime(): void {
    this.realtimeSubscription.add(
      this.realtimeService.watchTopic('/topic/leads').subscribe({
        next: (event) => {
          if ((event.tipo === 'REGISTRO' || event.tipo === 'ASIGNACION') && this.started) {
            this.reload();
          }
        },
        error: () => undefined
      })
    );
  }

  private shouldUseVisibleTeamsCatalog(): boolean {
    return this.isEquipoLocked() || this.teamScope.isDashboardTeamScoped() || this.sessionService.getPrimaryRole() === 'COMMUNITY';
  }

  private campanaKey(idCampana: number | null): string {
    return idCampana == null ? 'sin-campana' : String(idCampana);
  }

  private nombreEquipo(idEquipo: number | null, nombres: Map<number, string>): string {
    return idEquipo == null ? SIN_EQUIPO : nombres.get(idEquipo) ?? `Equipo ${idEquipo}`;
  }

  private resolveAccent(nombreEquipo: string, index: number): string {
    const normalizado = nombreEquipo.toLowerCase();
    const marca = BRAND_ACCENTS.find((entry) => normalizado.includes(entry.match));
    return marca ? marca.accent : FALLBACK_ACCENTS[index % FALLBACK_ACCENTS.length];
  }

  private compareNombre(left: string, sinValor: string, right: string): number {
    if (left === sinValor) return 1;
    if (right === sinValor) return -1;
    return left.localeCompare(right);
  }

  // Pivote: agrupa celdas planas por equipo → campaña → hora
  private accumulate(data: LoadResult): Array<{
    idEquipo: number | null;
    nombreEquipo: string;
    accent: string;
    campanas: Array<{ key: string; idCampana: number | null; nombre: string; total: number; porHora: Map<number, { total: number; unicos: number }> }>;
    horas: number[];
  }> {
    type DraftCampana = { key: string; idCampana: number | null; nombre: string; total: number; porHora: Map<number, { total: number; unicos: number }> };
    type DraftEquipo = { idEquipo: number | null; campanas: Map<string, DraftCampana>; horasSet: Set<number> };

    const equipos = new Map<string, DraftEquipo>();

    for (const celda of data.celdas) {
      const equipoKey = celda.idEquipo == null ? 'null' : String(celda.idEquipo);
      const equipo = equipos.get(equipoKey) ?? { idEquipo: celda.idEquipo, campanas: new Map(), horasSet: new Set() };
      const campKey = this.campanaKey(celda.idCampana);
      const campana = equipo.campanas.get(campKey) ?? { key: campKey, idCampana: celda.idCampana, nombre: celda.nombreCampana ?? SIN_CAMPANA, total: 0, porHora: new Map() };
      const existing = campana.porHora.get(celda.hora) ?? { total: 0, unicos: 0 };
      existing.total += celda.total;
      existing.unicos += celda.unicos;
      campana.porHora.set(celda.hora, existing);
      campana.total += celda.total;
      equipo.campanas.set(campKey, campana);
      equipo.horasSet.add(celda.hora);
      equipos.set(equipoKey, equipo);
    }

    return [...equipos.values()]
      .sort((a, b) => this.compareNombre(
        this.nombreEquipo(a.idEquipo, data.nombresEquipo), SIN_EQUIPO,
        this.nombreEquipo(b.idEquipo, data.nombresEquipo)
      ))
      .map((equipo, index) => {
        const nombreEquipo = this.nombreEquipo(equipo.idEquipo, data.nombresEquipo);
        const horas = [...equipo.horasSet].sort((a, b) => a - b);
        return {
          idEquipo: equipo.idEquipo,
          nombreEquipo,
          accent: this.resolveAccent(nombreEquipo, index),
          campanas: [...equipo.campanas.values()].sort((a, b) => this.compareNombre(a.nombre, SIN_CAMPANA, b.nombre)),
          horas
        };
      });
  }

  private buildMatriz(
    equipo: ReturnType<AdminAfluenciaHoraFacade['accumulate']>[number],
    seleccion: Set<string> | null
  ): AfluenciaEquipoMatriz {
    const campanas = seleccion ? equipo.campanas.filter((c) => seleccion.has(c.key)) : equipo.campanas;

    // Rango continuo de horas (de min a max)
    let minHora = 23;
    let maxHora = 0;
    for (const h of equipo.horas) {
      if (h < minHora) minHora = h;
      if (h > maxHora) maxHora = h;
    }

    let totalEventos = 0;
    let totalUnicos = 0;
    let maxCeldaTotal = 0;

    const filas: AfluenciaHoraFila[] = [];
    for (let h = minHora; h <= maxHora; h++) {
      let filaTotal = 0;
      let filaUnicos = 0;
      const celdas: AfluenciaHoraCelda[] = campanas.map((campana) => {
        const datos = campana.porHora.get(h);
        const t = datos?.total ?? 0;
        const u = datos?.unicos ?? 0;
        filaTotal += t;
        filaUnicos += u;
        if (t > maxCeldaTotal) maxCeldaTotal = t;
        return { total: t, unicos: u, repetidos: Math.max(0, t - u) };
      });
      totalEventos += filaTotal;
      totalUnicos += filaUnicos;
      filas.push({
        hora: h,
        label: HORA_LABELS[h] ?? `${h}:00`,
        total: filaTotal,
        unicos: filaUnicos,
        repetidos: Math.max(0, filaTotal - filaUnicos),
        celdas
      });
    }

    return {
      idEquipo: equipo.idEquipo,
      nombreEquipo: equipo.nombreEquipo,
      accent: equipo.accent,
      totalEventos,
      totalUnicos,
      maxCeldaTotal,
      campanas: campanas.map((c) => ({ key: c.key, idCampana: c.idCampana, nombre: c.nombre, total: c.total })),
      filas
    };
  }
}
