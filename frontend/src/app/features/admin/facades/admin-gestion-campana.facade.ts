import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, map, of, startWith, switchMap } from 'rxjs';
import { CatalogoResponse } from '../../../shared/models/preventa/preventa.models';
import { AdminEquipoService } from '../services/admin-equipo.service';
import {
  AdminGestionCampanaService,
  GestionCampoTipi,
  GestionModo,
  GestionPorCampanaCelda
} from '../services/admin-gestion-campana.service';

export type GestionPeriodo = 'dia' | 'mes' | 'personalizado';

/** Columna de campaña dentro de la matriz de un equipo. */
export interface GestionCampanaColumn {
  key: string;
  idCampana: number | null;
  nombre: string;
  total: number; // leads con gestión en el período para esa campaña
}

/** Una celda de la matriz: cantidad + % sobre el total de su campaña. */
export interface GestionCelda {
  key: string;
  cantidad: number;
  porcentaje: number;
}

/** Fila de tipificación de la matriz. */
export interface GestionFila {
  codigo: string;
  label: string;
  esCierre: boolean; // tipificación de cierre (se resalta)
  historica: boolean; // código con datos pero fuera del catálogo vigente
  total: number; // suma de la fila sobre las campañas visibles (autocalc)
  celdas: GestionCelda[]; // alineadas con las columnas visibles del equipo
}

/** Matriz completa de un equipo. */
export interface GestionEquipoMatriz {
  idEquipo: number | null;
  nombreEquipo: string;
  accent: string; // color de acento del equipo (branding)
  totalLeads: number; // sobre las campañas visibles
  campanas: GestionCampanaColumn[];
  filas: GestionFila[];
}

/** Opción del selector de campañas. */
export interface GestionCampanaOption {
  key: string;
  nombre: string;
  nombreEquipo: string;
  total: number;
  activa: boolean;
}

export interface GestionCampanaGroup {
  label: string;
  total: number;
  items: GestionCampanaOption[];
}

const SIN_EQUIPO = 'Sin equipo';
const SIN_CAMPANA = 'Sin campaña';
const CIERRE_PREVENTA = 'ES_CIERRE_PREVENTA';

// Acentos por marca (sustring en minúsculas) + fallback ciclado por posición para equipos no
// reconocidos. Da separación visual y respeta Claro=rojo / Win=naranja.
const BRAND_ACCENTS: Array<{ match: string; accent: string }> = [
  { match: 'claro', accent: '#e53935' },
  { match: 'win', accent: '#fb8c00' },
  { match: 'movistar', accent: '#1e88e5' },
  { match: 'entel', accent: '#3949ab' },
  { match: 'bitel', accent: '#43a047' }
];
const FALLBACK_ACCENTS = ['#5b6cff', '#8e24aa', '#00897b', '#6d4c41', '#546e7a', '#c2185b'];

type Criteria = { requestId: number; campo: GestionCampoTipi; modo: GestionModo; desde?: string; hasta?: string };

type LoadResult = { celdas: GestionPorCampanaCelda[]; catalogo: CatalogoResponse; nombresEquipo: Map<number, string> };

type State =
  | { status: 'idle' }
  | { status: 'loading' | 'refreshing'; requestId: number }
  | { status: 'success'; requestId: number; data: LoadResult }
  | { status: 'error'; requestId: number };

// Estructuras intermedias del pivote (con TODAS las campañas, antes de aplicar el filtro de columnas).
interface AccCampana {
  key: string;
  idCampana: number | null;
  nombre: string;
  total: number;
  porCodigo: Map<string, number>;
}
interface AccEquipo {
  idEquipo: number | null;
  nombreEquipo: string;
  accent: string;
  campanas: AccCampana[];
  codigos: string[]; // filas: catálogo por orden + históricos al final
  ordenPorCodigo: Map<string, number>;
  cierres: Set<string>;
}

@Injectable()
export class AdminGestionCampanaFacade {
  private readonly service = inject(AdminGestionCampanaService);
  private readonly equipoService = inject(AdminEquipoService);

  private requestId = 0;
  private started = false;
  private readonly criteria = signal<Criteria | null>(null);

  readonly campo = signal<GestionCampoTipi>('MAYOR');
  readonly modo = signal<GestionModo>('GESTIONADOS');
  readonly periodo = signal<GestionPeriodo>('dia');
  readonly customDesde = signal('');
  readonly customHasta = signal('');
  readonly customRangeError = signal<string | null>(null);
  readonly selectedCampanaKeys = signal<string[]>([]);
  readonly selectedEquipoId = signal<number | null>(null);

  readonly campoOptions: Array<{ label: string; value: GestionCampoTipi }> = [
    { label: 'Mayor', value: 'MAYOR' },
    { label: 'Última', value: 'ULTIMA' },
    { label: 'Primera', value: 'PRIMERA' }
  ];
  readonly modoOptions: Array<{ label: string; value: GestionModo }> = [
    { label: 'Gestionados', value: 'GESTIONADOS' },
    { label: 'Ingresados', value: 'INGRESADOS' }
  ];
  readonly periodoOptions: Array<{ label: string; value: GestionPeriodo }> = [
    { label: 'Hoy', value: 'dia' },
    { label: 'Este mes', value: 'mes' },
    { label: 'Personalizado', value: 'personalizado' }
  ];

  readonly campoAyuda = computed(() => {
    const campoTexto =
      this.campo() === 'PRIMERA' ? 'primera' : this.campo() === 'ULTIMA' ? 'última' : 'mayor';
    if (this.modo() === 'INGRESADOS') {
      return `Leads registrados en el período, contados por su ${campoTexto} tipificación actual.`;
    }
    return `Leads contados por su ${campoTexto} tipificación ocurrida en el período elegido.`;
  });

  private readonly state = toSignal(
    toObservable(this.criteria).pipe(
      switchMap((criteria) => {
        if (!criteria) {
          return of<State>({ status: 'idle' });
        }
        return forkJoin({
          celdas: this.service.obtenerGestionPorCampana(criteria.campo, criteria.modo, criteria.desde, criteria.hasta),
          catalogo: this.service.obtenerCatalogoAgregado(),
          equipos: this.equipoService.listarEquipos()
        }).pipe(
          map(({ celdas, catalogo, equipos }): State => ({
            status: 'success',
            requestId: criteria.requestId,
            data: {
              celdas,
              catalogo,
              nombresEquipo: new Map(equipos.map((equipo) => [equipo.id, equipo.nombre]))
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

  // Pivote completo (con todas las campañas). Se memoiza aparte del filtro de columnas para no
  // recalcularlo cuando solo cambia el MultiSelect de campañas.
  private readonly accumulated = computed<AccEquipo[]>(() => {
    const state = this.state();
    return state.status === 'success' ? this.accumulate(state.data) : [];
  });

  private readonly visibleAccumulated = computed<AccEquipo[]>(() => {
    const selectedEquipoId = this.selectedEquipoId();
    if (selectedEquipoId === null) {
      return this.accumulated();
    }
    return this.accumulated().filter((equipo) => equipo.idEquipo === selectedEquipoId);
  });

  readonly campanaGroups = computed<GestionCampanaGroup[]>(() => {
    const keysAsignadas = new Set<string>();
    const groups: GestionCampanaGroup[] = [];

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

  readonly campanaOptions = computed<GestionCampanaOption[]>(() =>
    this.campanaGroups().flatMap((group) => group.items)
  );

  readonly matrices = computed<GestionEquipoMatriz[]>(() => {
    const seleccion = new Set(this.selectedCampanaKeys());
    const filtrar = seleccion.size > 0;
    return this.visibleAccumulated()
      .map((equipo) => this.buildMatriz(equipo, filtrar ? seleccion : null))
      .filter((matriz) => matriz.campanas.length > 0);
  });

  readonly isEmpty = computed(() => this.state().status === 'success' && this.matrices().length === 0);
  readonly hasActiveFilter = computed(() => this.selectedCampanaKeys().length > 0);

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    this.reload();
  }

  setCampo(campo: GestionCampoTipi | null | undefined): void {
    if (!campo || this.campo() === campo) {
      return;
    }
    this.campo.set(campo);
    this.reload();
  }

  setModo(modo: GestionModo | null | undefined): void {
    if (!modo || this.modo() === modo) {
      return;
    }
    this.modo.set(modo);
    this.reload();
  }

  setPeriodo(periodo: GestionPeriodo | null | undefined): void {
    if (!periodo || this.periodo() === periodo) {
      return;
    }
    this.periodo.set(periodo);
    this.customRangeError.set(null);
    if (periodo !== 'personalizado' || this.hasValidCustomRange()) {
      this.reload();
    }
  }

  setCustomDesde(value: string): void {
    this.customDesde.set(value ?? '');
    this.maybeReloadCustom();
  }

  setCustomHasta(value: string): void {
    this.customHasta.set(value ?? '');
    this.maybeReloadCustom();
  }

  setSelectedCampanas(keys: string[] | null | undefined): void {
    this.selectedCampanaKeys.set(keys ?? []);
  }

  setSelectedEquipoId(idEquipo: number | null | undefined): void {
    const normalized = idEquipo ?? null;
    if (normalized === this.selectedEquipoId()) {
      return;
    }
    this.selectedEquipoId.set(normalized);
    this.selectedCampanaKeys.set([]);
  }

  clearCampanaFilter(): void {
    this.selectedCampanaKeys.set([]);
  }

  reload(): void {
    const range = this.resolveRange();
    if (range === null) {
      return; // período personalizado incompleto/ inválido: no dispares la carga
    }
    this.criteria.set({
      requestId: ++this.requestId,
      campo: this.campo(),
      modo: this.modo(),
      desde: range.desde,
      hasta: range.hasta
    });
  }

  // ---- internos ----

  private maybeReloadCustom(): void {
    if (this.periodo() === 'personalizado' && this.hasValidCustomRange()) {
      this.customRangeError.set(null);
      this.reload();
    }
  }

  private hasValidCustomRange(): boolean {
    const desde = this.customDesde();
    const hasta = this.customHasta();
    if (!desde || !hasta) {
      this.customRangeError.set(null);
      return false;
    }
    if (desde > hasta) {
      this.customRangeError.set('La fecha de inicio no puede ser posterior a la fecha final.');
      return false;
    }
    return true;
  }

  /** Devuelve las cotas a enviar. `undefined` en una cota = el backend usa el día operativo de hoy. */
  private resolveRange(): { desde?: string; hasta?: string } | null {
    switch (this.periodo()) {
      case 'dia':
        return { desde: undefined, hasta: undefined };
      case 'mes':
        return { desde: `${this.localToday().substring(0, 8)}01`, hasta: undefined };
      case 'personalizado':
        return this.hasValidCustomRange() ? { desde: this.customDesde(), hasta: this.customHasta() } : null;
    }
  }

  private localToday(): string {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  private campanaKey(idCampana: number | null): string {
    return idCampana == null ? 'sin-campana' : String(idCampana);
  }

  /** Arma el pivote completo por equipo (todas las campañas), ordenando filas y equipos. */
  private accumulate(data: LoadResult): AccEquipo[] {
    const cierres = this.cierreCodigos(data.catalogo);
    const ordenPorCodigo = new Map<string, number>();
    const filasCatalogo = [...data.catalogo.tipificaciones]
      .sort((a, b) => a.orden - b.orden)
      .map((tipi) => {
        ordenPorCodigo.set(tipi.codigo, tipi.orden);
        return tipi.codigo;
      });

    type Draft = {
      idEquipo: number | null;
      campanas: Map<string, AccCampana>;
      codigos: Set<string>;
    };
    const equipos = new Map<string, Draft>();

    for (const celda of data.celdas) {
      const equipoKey = celda.idEquipo == null ? 'null' : String(celda.idEquipo);
      const equipo = equipos.get(equipoKey) ?? { idEquipo: celda.idEquipo, campanas: new Map(), codigos: new Set<string>() };
      const campKey = this.campanaKey(celda.idCampana);
      const campana = equipo.campanas.get(campKey) ?? {
        key: campKey,
        idCampana: celda.idCampana,
        nombre: celda.nombreCampana ?? SIN_CAMPANA,
        total: 0,
        porCodigo: new Map<string, number>()
      };
      campana.porCodigo.set(celda.codigoTipificacion, (campana.porCodigo.get(celda.codigoTipificacion) ?? 0) + celda.cantidad);
      campana.total += celda.cantidad;
      equipo.campanas.set(campKey, campana);
      equipo.codigos.add(celda.codigoTipificacion);
      equipos.set(equipoKey, equipo);
    }

    const ordenados = [...equipos.values()].sort((a, b) =>
      this.compareNombre(this.nombreEquipo(a.idEquipo, data.nombresEquipo), SIN_EQUIPO, this.nombreEquipo(b.idEquipo, data.nombresEquipo))
    );

    return ordenados.map((equipo, index) => {
      const nombreEquipo = this.nombreEquipo(equipo.idEquipo, data.nombresEquipo);
      const historicos = [...equipo.codigos].filter((codigo) => !ordenPorCodigo.has(codigo)).sort((a, b) => a.localeCompare(b));
      return {
        idEquipo: equipo.idEquipo,
        nombreEquipo,
        accent: this.resolveAccent(nombreEquipo, index),
        campanas: [...equipo.campanas.values()].sort((a, b) => this.compareNombre(a.nombre, SIN_CAMPANA, b.nombre)),
        codigos: [...filasCatalogo, ...historicos],
        ordenPorCodigo,
        cierres
      };
    });
  }

  /** Construye la matriz visible de un equipo aplicando el filtro de columnas (si hay). */
  private buildMatriz(equipo: AccEquipo, seleccion: Set<string> | null): GestionEquipoMatriz {
    const campanas = seleccion ? equipo.campanas.filter((campana) => seleccion.has(campana.key)) : equipo.campanas;

    let totalLeads = 0;
    const filas: GestionFila[] = equipo.codigos.map((codigo) => {
      const orden = equipo.ordenPorCodigo.get(codigo);
      let total = 0;
      const celdas: GestionCelda[] = campanas.map((campana) => {
        const cantidad = campana.porCodigo.get(codigo) ?? 0;
        total += cantidad;
        return {
          key: campana.key,
          cantidad,
          porcentaje: campana.total > 0 ? (cantidad / campana.total) * 100 : 0
        };
      });
      totalLeads += total;
      return {
        codigo,
        label: orden === undefined ? codigo : `${orden} - ${codigo}`,
        esCierre: equipo.cierres.has(codigo),
        historica: orden === undefined,
        total,
        celdas
      };
    });

    return {
      idEquipo: equipo.idEquipo,
      nombreEquipo: equipo.nombreEquipo,
      accent: equipo.accent,
      totalLeads,
      campanas: campanas.map((campana) => ({ key: campana.key, idCampana: campana.idCampana, nombre: campana.nombre, total: campana.total })),
      filas
    };
  }

  private nombreEquipo(idEquipo: number | null, nombres: Map<number, string>): string {
    return idEquipo == null ? SIN_EQUIPO : nombres.get(idEquipo) ?? `Equipo ${idEquipo}`;
  }

  private resolveAccent(nombreEquipo: string, index: number): string {
    const normalizado = nombreEquipo.toLowerCase();
    const marca = BRAND_ACCENTS.find((entry) => normalizado.includes(entry.match));
    return marca ? marca.accent : FALLBACK_ACCENTS[index % FALLBACK_ACCENTS.length];
  }

  /** Códigos de tipificación cuyo cierre está marcado por comportamiento (data-driven). */
  private cierreCodigos(catalogo: CatalogoResponse): Set<string> {
    const cierres = new Set<string>();
    for (const tipi of catalogo.tipificaciones) {
      const esCierre = (tipi.subtipificaciones ?? []).some((sub) => (sub.comportamientos ?? []).includes(CIERRE_PREVENTA));
      if (esCierre) {
        cierres.add(tipi.codigo);
      }
    }
    return cierres;
  }

  /** Ordena alfabéticamente pero empuja al final el valor "Sin ..." indicado. */
  private compareNombre(left: string, sinValor: string, right: string): number {
    if (left === sinValor) {
      return 1;
    }
    if (right === sinValor) {
      return -1;
    }
    return left.localeCompare(right);
  }
}
