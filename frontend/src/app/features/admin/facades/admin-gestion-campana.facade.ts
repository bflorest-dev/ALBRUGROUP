import { Injectable, OnDestroy, computed, effect, inject, signal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Subscription, catchError, forkJoin, map, of, startWith, switchMap } from 'rxjs';
import { CatalogoResponse } from '../../../shared/models/preventa/preventa.models';
import { esEquipoOperativo } from '../../../shared/utils/equipos-operativos';
import { resolveMetricsRange } from '../../../shared/utils/metrics-period';
import { LeadRealtimeService } from '../../preventa/services/lead-realtime.service';
import { AdminEquipoService } from '../services/admin-equipo.service';
import {
  AdminGestionCampanaService,
  GestionCampoTipi,
  GestionModo,
  GestionPorCampanaCelda
} from '../services/admin-gestion-campana.service';

export type GestionPeriodo = 'dia' | 'semana' | 'mes';

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

/** Un tramo de la barra apilada: una tipificación dentro de una campaña. */
export interface GestionBarraSegmento {
  codigo: string;
  label: string;
  cantidad: number;
  porcentaje: number;
  /** Paso de la rampa ordinal. -1 = histórica o cola agrupada (gris neutro). */
  indiceRampa: number;
}

/** Una barra: la composición de desenlaces de una campaña. */
export interface GestionBarraCampana {
  key: string;
  nombre: string;
  total: number;
  /** >0 cuando la barra agrupa campañas de bajo volumen. */
  campanasAgrupadas: number;
  segmentos: GestionBarraSegmento[];
}

export interface GestionEquipoBarras {
  idEquipo: number | null;
  nombreEquipo: string;
  accent: string;
  totalLeads: number;
  campanas: GestionBarraCampana[];
}

/** Un punto de la dispersión: una campaña situada por volumen y efectividad. */
export interface GestionPuntoCampana {
  key: string;
  nombre: string;
  total: number;
  preventas: number;
  /** % de preventa sobre los leads gestionados de la campaña. */
  tasa: number;
  /** Con muy pocos leads la tasa no es concluyente; el punto se atenúa en vez de ocultarse. */
  bajoVolumen: boolean;
}

export interface GestionEquipoDispersion {
  idEquipo: number | null;
  nombreEquipo: string;
  accent: string;
  totalLeads: number;
  preventas: number;
  /** Tasa global del equipo: la línea de referencia contra la que se comparan las campañas. */
  tasaEquipo: number;
  puntos: GestionPuntoCampana[];
}

/**
 * Debajo de este volumen el porcentaje de una campaña no es interpretable: con 1 lead cualquier
 * desenlace es "100%" y grita igual que una campaña de 30. Esas campañas se agrupan.
 */
const MIN_LEADS_CAMPANA = 5;
const SIN_TIPIFICAR_CODIGO = 'SIN_TIPIFICAR';
const SIN_TIPIFICAR_LABEL = '0 - SIN TIPIFICAR';

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

type EquipoOption = { label: string; value: number | null };
type LoadResult = {
  celdas: GestionPorCampanaCelda[];
  catalogo: CatalogoResponse;
  nombresEquipo: Map<number, string>;
  equipoOptions: EquipoOption[];
};

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
  labelsPorCodigo: Map<string, string>;
  cierres: Set<string>;
}

@Injectable()
export class AdminGestionCampanaFacade implements OnDestroy {
  private readonly service = inject(AdminGestionCampanaService);
  private readonly equipoService = inject(AdminEquipoService);
  private readonly realtimeService = inject(LeadRealtimeService);
  private readonly realtimeSubscription = new Subscription();

  private requestId = 0;
  private started = false;
  private readonly criteria = signal<Criteria | null>(null);

  readonly campo = signal<GestionCampoTipi>('MAYOR');
  readonly modo = signal<GestionModo>('INGRESADOS');
  readonly periodo = signal<GestionPeriodo>('dia');
  /** Dia puntual elegido en el segmento "Hoy" (`YYYY-MM-DD`). `null` = hoy. */
  readonly diaSeleccionado = signal<string | null>(null);
  readonly selectedCampanaKeys = signal<string[]>([]);
  readonly selectedEquipoId = signal<number | null>(null);

  readonly campoOptions: Array<{ label: string; value: GestionCampoTipi }> = [
    { label: 'Mayor', value: 'MAYOR' },
    { label: 'Primera', value: 'PRIMERA' },
    { label: 'Última', value: 'ULTIMA' }
  ];
  readonly modoOptions: Array<{ label: string; value: GestionModo }> = [
    { label: 'Ingresados', value: 'INGRESADOS' },
    { label: 'Gestionados', value: 'GESTIONADOS' }
  ];
  readonly periodoOptions: Array<{ label: string; value: GestionPeriodo }> = [
    { label: 'Hoy', value: 'dia' },
    { label: 'Semanal', value: 'semana' },
    { label: 'Mensual', value: 'mes' }
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

  /**
   * Equipos del selector, con "Todos" primero para mantener el mismo control en todos los bloques.
   * Con "Todos" se apila una matriz por equipo.
   */
  readonly equipoOptions = computed<EquipoOption[]>(() => {
    const state = this.state();
    if (state.status !== 'success') {
      return [];
    }
    return [{ label: 'Todos', value: null }, ...state.data.equipoOptions];
  });

  private aplicoEquipoPorDefecto = false;

  constructor() {
    // "Todos" existe como opción, pero el arranque es con un solo equipo: la vista apilada es
    // justamente lo que se quiso evitar. Se hace una sola vez, para no pisar la elección del usuario.
    // (Client-side: cambiar de equipo filtra el pivote, no vuelve a pegar al backend.)
    effect(() => {
      const options = this.equipoOptions();
      if (this.aplicoEquipoPorDefecto) {
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

  /** Vista de barras: una barra por campaña, ordenadas por volumen y con la cola larga agrupada. */
  readonly barrasPorEquipo = computed<GestionEquipoBarras[]>(() =>
    this.matrices().map((matriz) => ({
      idEquipo: matriz.idEquipo,
      nombreEquipo: matriz.nombreEquipo,
      accent: matriz.accent,
      totalLeads: matriz.totalLeads,
      campanas: this.buildBarras(matriz)
    }))
  );

  /** Vista de efectividad: cada campaña situada por volumen gestionado y tasa de preventa. */
  readonly dispersionPorEquipo = computed<GestionEquipoDispersion[]>(() =>
    this.matrices().map((matriz) => {
      const puntos = matriz.campanas.map((campana, indice) => {
        const preventas = matriz.filas
          .filter((fila) => fila.esCierre)
          .reduce((suma, fila) => suma + (fila.celdas[indice]?.cantidad ?? 0), 0);
        return {
          key: campana.key,
          nombre: campana.nombre,
          total: campana.total,
          preventas,
          tasa: campana.total > 0 ? (preventas / campana.total) * 100 : 0,
          bajoVolumen: campana.total < MIN_LEADS_CAMPANA
        };
      });
      const preventas = puntos.reduce((suma, punto) => suma + punto.preventas, 0);
      return {
        idEquipo: matriz.idEquipo,
        nombreEquipo: matriz.nombreEquipo,
        accent: matriz.accent,
        totalLeads: matriz.totalLeads,
        preventas,
        tasaEquipo: matriz.totalLeads > 0 ? (preventas / matriz.totalLeads) * 100 : 0,
        puntos: puntos.sort((left, right) => right.total - left.total)
      };
    })
  );

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
    // Salir de "dia" descarta el dia puntual: al volver, el segmento arranca de nuevo en "Hoy".
    if (periodo !== 'dia') {
      this.diaSeleccionado.set(null);
    }
    this.reload();
  }

  /** Dia puntual elegido en el calendario del segmento "Hoy". */
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
    this.criteria.set({
      requestId: ++this.requestId,
      campo: this.campo(),
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
          if (event.tipo === 'CAMPANA_CORREGIDA' && this.started) {
            this.reload();
          }
        },
        error: () => undefined
      })
    );
  }

  /** Devuelve las cotas a enviar. `undefined` en una cota = el backend usa el día operativo de hoy. */
  private resolveRange(): { desde?: string; hasta?: string } {
    return resolveMetricsRange(this.periodo(), this.diaSeleccionado());
  }

  private campanaKey(idCampana: number | null): string {
    return idCampana == null ? 'sin-campana' : String(idCampana);
  }

  /** Arma el pivote completo por equipo (todas las campañas), ordenando filas y equipos. */
  private accumulate(data: LoadResult): AccEquipo[] {
    const cierres = this.cierreCodigos(data.catalogo);
    const ordenPorCodigo = new Map<string, number>();
    const labelsPorCodigo = new Map<string, string>([[SIN_TIPIFICAR_CODIGO, SIN_TIPIFICAR_LABEL]]);
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
      const codigoTipificacion = celda.codigoTipificacion ?? SIN_TIPIFICAR_CODIGO;
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
      campana.porCodigo.set(codigoTipificacion, (campana.porCodigo.get(codigoTipificacion) ?? 0) + celda.cantidad);
      campana.total += celda.cantidad;
      equipo.campanas.set(campKey, campana);
      equipo.codigos.add(codigoTipificacion);
      equipos.set(equipoKey, equipo);
    }

    const ordenados = [...equipos.values()].sort((a, b) =>
      this.compareNombre(this.nombreEquipo(a.idEquipo, data.nombresEquipo), SIN_EQUIPO, this.nombreEquipo(b.idEquipo, data.nombresEquipo))
    );

    return ordenados.map((equipo, index) => {
      const nombreEquipo = this.nombreEquipo(equipo.idEquipo, data.nombresEquipo);
      const tieneSinTipificar = equipo.codigos.has(SIN_TIPIFICAR_CODIGO);
      const historicos = [...equipo.codigos]
        .filter((codigo) => codigo !== SIN_TIPIFICAR_CODIGO && !ordenPorCodigo.has(codigo))
        .sort((a, b) => a.localeCompare(b));
      return {
        idEquipo: equipo.idEquipo,
        nombreEquipo,
        accent: this.resolveAccent(nombreEquipo, index),
        campanas: [...equipo.campanas.values()].sort((a, b) => this.compareNombre(a.nombre, SIN_CAMPANA, b.nombre)),
        codigos: [...(tieneSinTipificar ? [SIN_TIPIFICAR_CODIGO] : []), ...filasCatalogo, ...historicos],
        ordenPorCodigo,
        labelsPorCodigo,
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
        label: equipo.labelsPorCodigo.get(codigo) ?? (orden === undefined ? codigo : `${orden} - ${codigo}`),
        esCierre: equipo.cierres.has(codigo),
        historica: orden === undefined && codigo !== SIN_TIPIFICAR_CODIGO,
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

  /**
   * Arma las barras de un equipo: una por campaña, de mayor a menor volumen. Las campañas por
   * debajo del mínimo se suman en una sola barra "Otras campañas", pero solo si quedan al menos dos
   * barras individuales y hay más de una para agrupar: si no, agrupar escondería datos sin ganar nada.
   */
  private buildBarras(matriz: GestionEquipoMatriz): GestionBarraCampana[] {
    const porVolumen = matriz.campanas
      .map((campana, indice) => ({ campana, indice }))
      .sort((left, right) => right.campana.total - left.campana.total);

    const grandes = porVolumen.filter((entrada) => entrada.campana.total >= MIN_LEADS_CAMPANA);
    const chicas = porVolumen.filter((entrada) => entrada.campana.total < MIN_LEADS_CAMPANA);
    const agrupar = chicas.length > 1 && grandes.length >= 2;

    const individuales = agrupar ? grandes : porVolumen;
    const barras = individuales.map(({ campana, indice }) => ({
      key: campana.key,
      nombre: campana.nombre,
      total: campana.total,
      campanasAgrupadas: 0,
      segmentos: this.segmentosDeCampana(matriz, indice, campana.total)
    }));

    if (agrupar) {
      barras.push(this.barraAgrupada(matriz, chicas));
    }
    return barras;
  }

  private segmentosDeCampana(matriz: GestionEquipoMatriz, indice: number, total: number): GestionBarraSegmento[] {
    return matriz.filas
      .map((fila, posicion) => ({
        codigo: fila.codigo,
        label: fila.label,
        cantidad: fila.celdas[indice]?.cantidad ?? 0,
        porcentaje: total > 0 ? ((fila.celdas[indice]?.cantidad ?? 0) / total) * 100 : 0,
        indiceRampa: fila.historica ? -1 : posicion
      }))
      .filter((segmento) => segmento.cantidad > 0);
  }

  /** Suma las campañas de bajo volumen en una sola barra. */
  private barraAgrupada(
    matriz: GestionEquipoMatriz,
    chicas: Array<{ campana: GestionCampanaColumn; indice: number }>
  ): GestionBarraCampana {
    const total = chicas.reduce((suma, entrada) => suma + entrada.campana.total, 0);
    const segmentos = matriz.filas
      .map((fila, posicion) => {
        const cantidad = chicas.reduce((suma, { indice }) => suma + (fila.celdas[indice]?.cantidad ?? 0), 0);
        return {
          codigo: fila.codigo,
          label: fila.label,
          cantidad,
          porcentaje: total > 0 ? (cantidad / total) * 100 : 0,
          indiceRampa: fila.historica ? -1 : posicion
        };
      })
      .filter((segmento) => segmento.cantidad > 0);

    return {
      key: 'otras-campanas',
      nombre: 'Otras campañas',
      total,
      campanasAgrupadas: chicas.length,
      segmentos
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
