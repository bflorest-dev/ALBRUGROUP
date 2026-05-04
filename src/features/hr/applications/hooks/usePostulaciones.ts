/**
 * CUSTOM HOOKS para Postulaciones
 * FSD: caracteristicas/rrhh/postulaciones/hooks
 * 
 * Maneja estado de loading, error, y data para bandejas y acciones
 * Pattern: { data, loading, error, execute, success, refetch }
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import * as postulacionesApi from '../api';
import type {
  PostulacionResponse,
  PostulacionEventoResponse,
  GrupoCapacitacionResponse,
  CrearPostulacionRequest,
  ActualizarPostulacionRequest,
  TipificarPostulacionRequest,
  ConfirmarContratacionRequest,
  CrearGrupoCapacitacionRequest,
  AsignarPostulacionesGrupoRequest,
  ActualizarAsignacionPostulacionRequest,
  TipificacionCatalogo,
} from '../model';

const DEFAULT_BACKGROUND_REFETCH_INTERVAL_MS = 0;
const POSTULACIONES_SYNC_EVENT = 'postulaciones:updated';
const POSTULACIONES_SYNC_CHANNEL = 'postulaciones-sync';
const POSTULACIONES_SYNC_STORAGE_KEY = 'postulaciones:updatedAt';

interface BandejaHookOptions {
  enabled?: boolean;
  refetchIntervalMs?: number;
  syncBetweenTabs?: boolean;
}

interface FetchExecutionOptions {
  silent?: boolean;
}

interface QueuedReclutamientoFetch {
  params?: { estadoBandeja?: string };
  executionOptions?: FetchExecutionOptions;
}

interface QueuedCapacitacionFetch {
  params?: { sinGrupo?: boolean };
  executionOptions?: FetchExecutionOptions;
}

interface PostulacionesSyncPayload {
  source: string;
  timestamp: number;
}

let postulacionesSyncChannel: BroadcastChannel | null | undefined;

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return fallback;
}

function getPostulacionesSyncChannel(): BroadcastChannel | null {
  if (postulacionesSyncChannel !== undefined) {
    return postulacionesSyncChannel;
  }

  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    postulacionesSyncChannel = null;
    return postulacionesSyncChannel;
  }

  try {
    postulacionesSyncChannel = new BroadcastChannel(POSTULACIONES_SYNC_CHANNEL);
  } catch {
    postulacionesSyncChannel = null;
  }

  return postulacionesSyncChannel;
}

function buildPostulacionSignature(postulacion: PostulacionResponse): string {
  return [
    postulacion.id,
    postulacion.fechaActualizacion ?? '',
    postulacion.estadoBandeja ?? '',
    postulacion.estadoProceso ?? '',
    postulacion.etapaProceso ?? '',
    postulacion.idTipificacion ?? '',
    postulacion.codigoTipificacion ?? '',
    postulacion.idSubtipificacion ?? '',
    postulacion.tipificacion?.id ?? '',
    postulacion.tipificacion?.codigo ?? '',
    postulacion.postulante?.id ?? '',
    postulacion.postulante?.nombres ?? '',
    postulacion.postulante?.apellidos ?? '',
    postulacion.postulante?.documento ?? '',
    postulacion.postulante?.celular ?? '',
    postulacion.postulante?.listaNegra ?? '',
  ].join('|');
}

function sortPostulacionesByFechaCreacionDesc(
  items: PostulacionResponse[]
): PostulacionResponse[] {
  return [...items].sort((a, b) => {
    const aTs = new Date(a.fechaCreacion ?? a.fechaActualizacion ?? 0).getTime();
    const bTs = new Date(b.fechaCreacion ?? b.fechaActualizacion ?? 0).getTime();
    return bTs - aTs;
  });
}

function reconcilePostulacionesData(
  previousData: PostulacionResponse[] | null,
  nextData: PostulacionResponse[]
): PostulacionResponse[] {
  if (!previousData) return sortPostulacionesByFechaCreacionDesc(nextData);
  if (previousData.length === 0 && nextData.length === 0) return previousData;

  const previousById = new Map<
    number,
    { value: PostulacionResponse; signature: string }
  >();
  const nextById = new Map<number, PostulacionResponse>();

  previousData.forEach((item) => {
    previousById.set(item.id, {
      value: item,
      signature: buildPostulacionSignature(item),
    });
  });

  nextData.forEach((item) => {
    nextById.set(item.id, item);
  });

  let hasChanges = previousData.length !== nextData.length;

  const preservedOrderData = previousData
    .filter((item) => nextById.has(item.id))
    .map((item) => {
      const nextItem = nextById.get(item.id)!;
      const nextSignature = buildPostulacionSignature(nextItem);
      if (previousById.get(item.id)!.signature !== nextSignature) {
        hasChanges = true;
        return nextItem;
      }
      return item;
    });

  const addedItems = nextData.filter((item) => !previousById.has(item.id));
  if (addedItems.length > 0) {
    hasChanges = true;
  }

  const mergedData = [...preservedOrderData, ...addedItems];
  return hasChanges ? sortPostulacionesByFechaCreacionDesc(mergedData) : previousData;
}

function emitPostulacionesUpdated(source: string): void {
  if (typeof window === 'undefined') return;

  const payload: PostulacionesSyncPayload = {
    source,
    timestamp: Date.now(),
  };

  window.dispatchEvent(new CustomEvent<PostulacionesSyncPayload>(POSTULACIONES_SYNC_EVENT, { detail: payload }));

  const channel = getPostulacionesSyncChannel();
  try {
    channel?.postMessage(payload);
  } catch {
    // Si BroadcastChannel falla, localStorage mantiene la sincronización entre pestañas.
  }

  try {
    localStorage.setItem(POSTULACIONES_SYNC_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Si localStorage no está disponible, la sincronización entre pestañas se omite.
  }
}

function subscribeToPostulacionesUpdates(onUpdate: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const handleLocalEvent = () => {
    onUpdate();
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== POSTULACIONES_SYNC_STORAGE_KEY) return;
    if (!event.newValue || event.newValue === event.oldValue) return;
    onUpdate();
  };

  const channel = getPostulacionesSyncChannel();
  const handleChannelMessage = () => {
    onUpdate();
  };

  window.addEventListener(POSTULACIONES_SYNC_EVENT, handleLocalEvent);

  window.addEventListener('storage', handleStorage);
  channel?.addEventListener('message', handleChannelMessage);

  return () => {
    window.removeEventListener(POSTULACIONES_SYNC_EVENT, handleLocalEvent);
    window.removeEventListener('storage', handleStorage);
    channel?.removeEventListener('message', handleChannelMessage);
  };
}

/**
 * ────────────────────────────────────────────────────────────
 * HOOK para Bandeja Reclutamiento
 * ────────────────────────────────────────────────────────────
 */
export function useBandejaReclutamiento(options?: BandejaHookOptions) {
  const [data, setData] = useState<PostulacionResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reclutamientoInFlightRef = useRef<Promise<void> | null>(null);
  const queuedReclutamientoRequestRef = useRef<QueuedReclutamientoFetch | null>(null);

  const execute = useCallback(async (
    params?: { estadoBandeja?: string },
    executionOptions?: FetchExecutionOptions
  ) => {
    if (!executionOptions?.silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const result = await postulacionesApi.obtenerBandejaReclutamiento(params);
      const sortedResult = sortPostulacionesByFechaCreacionDesc(result);
      setData((previousData) => reconcilePostulacionesData(previousData, sortedResult));
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error al cargar bandeja de reclutamiento');
      setError(message);
      console.error('useBandejaReclutamiento:', err);
    } finally {
      if (!executionOptions?.silent) {
        setLoading(false);
      }
    }
  }, []);

  const runFetch = useCallback(
    (
      params?: { estadoBandeja?: string },
      executionOptions?: FetchExecutionOptions
    ) => {
      if (reclutamientoInFlightRef.current) {
        queuedReclutamientoRequestRef.current = {
          params,
          executionOptions,
        };
        return reclutamientoInFlightRef.current;
      }

      const task = execute(params, executionOptions).finally(() => {
        reclutamientoInFlightRef.current = null;

        const queuedRequest = queuedReclutamientoRequestRef.current;
        queuedReclutamientoRequestRef.current = null;

        if (queuedRequest) {
          void runFetch(queuedRequest.params, queuedRequest.executionOptions);
        }
      });

      reclutamientoInFlightRef.current = task;
      return task;
    },
    [execute]
  );

  useEffect(() => {
    if (options?.enabled === false) return;
    void runFetch(undefined, { silent: false });
  }, [runFetch, options?.enabled]);

  useEffect(() => {
    if (options?.enabled === false) return;

    const intervalMs = options?.refetchIntervalMs ?? DEFAULT_BACKGROUND_REFETCH_INTERVAL_MS;
    if (intervalMs <= 0) return;

    const intervalId = window.setInterval(() => {
      void runFetch(undefined, { silent: true });
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [runFetch, options?.enabled, options?.refetchIntervalMs]);

  useEffect(() => {
    if (options?.enabled === false) return;
    if (options?.syncBetweenTabs === false) return;

    return subscribeToPostulacionesUpdates(() => {
      void runFetch(undefined, { silent: true });
      window.setTimeout(() => {
        void runFetch(undefined, { silent: true });
      }, 1000);
    });
  }, [runFetch, options?.enabled, options?.syncBetweenTabs]);

  const refetch = useCallback(() => runFetch(undefined, { silent: true }), [runFetch]);

  return { data, loading, error, execute, refetch };
}

/**
 * ────────────────────────────────────────────────────────────
 * HOOK para Bandeja Capacitación
 * ────────────────────────────────────────────────────────────
 */
export function useBandejaCapacitacion(options?: BandejaHookOptions) {
  const [data, setData] = useState<PostulacionResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const capacitacionInFlightRef = useRef<Promise<void> | null>(null);
  const queuedCapacitacionRequestRef = useRef<QueuedCapacitacionFetch | null>(null);

  const execute = useCallback(async (
    params?: { sinGrupo?: boolean },
    executionOptions?: FetchExecutionOptions
  ) => {
    if (!executionOptions?.silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const result = await postulacionesApi.obtenerBandejaCapacitacion(params);
      setData((previousData) => reconcilePostulacionesData(previousData, result));
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error al cargar bandeja de capacitación');
      setError(message);
      console.error('useBandejaCapacitacion:', err);
    } finally {
      if (!executionOptions?.silent) {
        setLoading(false);
      }
    }
  }, []);

  const runFetch = useCallback(
    (
      params?: { sinGrupo?: boolean },
      executionOptions?: FetchExecutionOptions
    ) => {
      if (capacitacionInFlightRef.current) {
        queuedCapacitacionRequestRef.current = {
          params,
          executionOptions,
        };
        return capacitacionInFlightRef.current;
      }

      const task = execute(params, executionOptions).finally(() => {
        capacitacionInFlightRef.current = null;

        const queuedRequest = queuedCapacitacionRequestRef.current;
        queuedCapacitacionRequestRef.current = null;

        if (queuedRequest) {
          void runFetch(queuedRequest.params, queuedRequest.executionOptions);
        }
      });

      capacitacionInFlightRef.current = task;
      return task;
    },
    [execute]
  );

  useEffect(() => {
    if (options?.enabled === false) return;
    void runFetch(undefined, { silent: false });
  }, [runFetch, options?.enabled]);

  useEffect(() => {
    if (options?.enabled === false) return;

    const intervalMs = options?.refetchIntervalMs ?? DEFAULT_BACKGROUND_REFETCH_INTERVAL_MS;
    if (intervalMs <= 0) return;

    const intervalId = window.setInterval(() => {
      void runFetch(undefined, { silent: true });
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [runFetch, options?.enabled, options?.refetchIntervalMs]);

  useEffect(() => {
    if (options?.enabled === false) return;
    if (options?.syncBetweenTabs === false) return;

    return subscribeToPostulacionesUpdates(() => {
      void runFetch(undefined, { silent: true });
      window.setTimeout(() => {
        void runFetch(undefined, { silent: true });
      }, 1000);
    });
  }, [runFetch, options?.enabled, options?.syncBetweenTabs]);

  const refetch = useCallback(() => runFetch(undefined, { silent: true }), [runFetch]);

  return { data, loading, error, execute, refetch };
}

/**
 * ────────────────────────────────────────────────────────────
 * HOOK para listado general de postulaciones
 * ────────────────────────────────────────────────────────────
 */
export function usePostulaciones(options?: { enabled?: boolean }) {
  const [data, setData] = useState<PostulacionResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await postulacionesApi.obtenerPostulaciones();
      setData(result);
      return result;
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error al cargar postulaciones');
      setError(message);
      console.error('usePostulaciones:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (options?.enabled === false) return;
    execute().catch(() => undefined);
  }, [execute, options?.enabled]);

  const refetch = useCallback(() => execute(), [execute]);

  return { data, loading, error, execute, refetch };
}

/**
 * ────────────────────────────────────────────────────────────
 * HOOK para Bandeja Contratación
 * ────────────────────────────────────────────────────────────
 */
export function useBandejaContratacion(options?: BandejaHookOptions) {
  const [data, setData] = useState<PostulacionResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contratacionInFlightRef = useRef<Promise<void> | null>(null);
  const queuedContratacionRequestRef = useRef<FetchExecutionOptions | null>(null);

  const execute = useCallback(async (executionOptions?: FetchExecutionOptions) => {
    if (!executionOptions?.silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const result = await postulacionesApi.obtenerBandejaContratacion();
      setData((previousData) => reconcilePostulacionesData(previousData, result));
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error al cargar bandeja de contratación');
      setError(message);
      console.error('useBandejaContratacion:', err);
    } finally {
      if (!executionOptions?.silent) {
        setLoading(false);
      }
    }
  }, []);

  const runFetch = useCallback((executionOptions?: FetchExecutionOptions) => {
    if (contratacionInFlightRef.current) {
      queuedContratacionRequestRef.current = executionOptions ?? {};
      return contratacionInFlightRef.current;
    }

    const task = execute(executionOptions).finally(() => {
      contratacionInFlightRef.current = null;

      const queuedRequest = queuedContratacionRequestRef.current;
      queuedContratacionRequestRef.current = null;

      if (queuedRequest) {
        void runFetch(queuedRequest);
      }
    });

    contratacionInFlightRef.current = task;
    return task;
  }, [execute]);

  useEffect(() => {
    if (options?.enabled === false) return;
    void runFetch({ silent: false });
  }, [runFetch, options?.enabled]);

  useEffect(() => {
    if (options?.enabled === false) return;

    const intervalMs = options?.refetchIntervalMs ?? DEFAULT_BACKGROUND_REFETCH_INTERVAL_MS;
    if (intervalMs <= 0) return;

    const intervalId = window.setInterval(() => {
      void runFetch({ silent: true });
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [runFetch, options?.enabled, options?.refetchIntervalMs]);

  useEffect(() => {
    if (options?.enabled === false) return;
    if (options?.syncBetweenTabs === false) return;

    return subscribeToPostulacionesUpdates(() => {
      void runFetch({ silent: true });
    });
  }, [runFetch, options?.enabled, options?.syncBetweenTabs]);

  const refetch = useCallback(() => runFetch({ silent: true }), [runFetch]);

  return { data, loading, error, execute, refetch };
}

/**
 * ────────────────────────────────────────────────────────────
 * HOOK para Crear Postulación
 * ────────────────────────────────────────────────────────────
 */
export function useCrearPostulacion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState<PostulacionResponse | null>(null);

  const execute = useCallback(async (body: CrearPostulacionRequest) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await postulacionesApi.crearPostulacion(body);
      setData(result);
      setSuccess(true);
      emitPostulacionesUpdated('crear-postulacion');
      return result;
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error al crear postulación');
      setError(message);
      console.error('useCrearPostulacion:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, execute, success };
}

/**
 * ────────────────────────────────────────────────────────────
 * HOOK para Actualizar Postulación
 * ────────────────────────────────────────────────────────────
 */
export function useActualizarPostulacion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState<PostulacionResponse | null>(null);

  const execute = useCallback(async (id: number, body: ActualizarPostulacionRequest) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await postulacionesApi.actualizarPostulacion(id, body);
      setData(result);
      setSuccess(true);
      emitPostulacionesUpdated('actualizar-postulacion');
      return result;
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error al actualizar postulación');
      setError(message);
      console.error('useActualizarPostulacion:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, execute, success };
}

/**
 * ────────────────────────────────────────────────────────────
 * HOOK para Tipificar Postulación
 * ────────────────────────────────────────────────────────────
 */
export function useTipificarPostulacion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState<PostulacionResponse | null>(null);

  const execute = useCallback(async (id: number, body: TipificarPostulacionRequest) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await postulacionesApi.tipificarPostulacionDirecta({
        idPostulacion: id,
        ...body,
      });
      setData(result);
      setSuccess(true);
      emitPostulacionesUpdated('tipificar-postulacion');
      return result;
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error al tipificar postulación');
      setError(message);
      console.error('useTipificarPostulacion:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, execute, success };
}

/**
 * ────────────────────────────────────────────────────────────
 * HOOK para Confirmar Contratación
 * ────────────────────────────────────────────────────────────
 */
export function useConfirmarContratacion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState<PostulacionResponse | null>(null);

  const execute = useCallback(async (id: number, body: ConfirmarContratacionRequest) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await postulacionesApi.confirmarContratacionDirecta({
        idPostulacion: id,
        ...body,
      });
      setData(result);
      setSuccess(true);
      emitPostulacionesUpdated('confirmar-contratacion');
      return result;
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error al confirmar contratación');
      setError(message);
      console.error('useConfirmarContratacion:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, execute, success };
}

/**
 * ────────────────────────────────────────────────────────────
 * HOOK para Cargar Catálogo de Tipificaciones
 * ────────────────────────────────────────────────────────────
 */
export function useCatalogoTipificaciones(etapa: string) {
  const [data, setData] = useState<TipificacionCatalogo[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await postulacionesApi.obtenerCatalogoTipificaciones(etapa);
      setData(result);
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error al cargar catálogo de tipificaciones');
      setError(message);
      console.error('useCatalogoTipificaciones:', err);
    } finally {
      setLoading(false);
    }
  }, [etapa]);

  useEffect(() => {
    if (etapa) {
      execute();
    }
  }, [etapa, execute]);

  const refetch = useCallback(() => execute(), [execute]);

  return { data, loading, error, refetch };
}

/**
 * ────────────────────────────────────────────────────────────
 * HOOK para Detalle de Postulación
 * ────────────────────────────────────────────────────────────
 */
export function useDetallePostulacion() {
  const [data, setData] = useState<PostulacionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await postulacionesApi.obtenerPostulacionPorId(id);
      setData(result);
      return result;
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error al cargar detalle de postulación');
      setError(message);
      console.error('useDetallePostulacion:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback((id: number) => execute(id), [execute]);

  return { data, loading, error, execute, refetch };
}

/**
 * ────────────────────────────────────────────────────────────
 * HOOK para Eventos de Postulación
 * ────────────────────────────────────────────────────────────
 */
export function useEventosPostulacion(idPostulacion?: number) {
  const [data, setData] = useState<PostulacionEventoResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await postulacionesApi.obtenerEventosPostulacion(id);
      setData(result);
      return result;
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error al cargar eventos de postulación');
      setError(message);
      console.error('useEventosPostulacion:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (idPostulacion) {
      execute(idPostulacion);
    }
  }, [idPostulacion, execute]);

  const refetch = useCallback(() => {
    if (!idPostulacion) return Promise.resolve([] as PostulacionEventoResponse[]);
    return execute(idPostulacion);
  }, [idPostulacion, execute]);

  return { data, loading, error, execute, refetch };
}

/**
 * ────────────────────────────────────────────────────────────
 * HOOKS para Grupos de Capacitación
 * ────────────────────────────────────────────────────────────
 */
export function useCrearGrupoCapacitacion() {
  const [data, setData] = useState<GrupoCapacitacionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (body: CrearGrupoCapacitacionRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await postulacionesApi.crearGrupoCapacitacion(body);
      setData(result);
      return result;
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error al crear grupo de capacitación');
      setError(message);
      console.error('useCrearGrupoCapacitacion:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, execute };
}

export function useAsignarPostulacionesAGrupo() {
  const [data, setData] = useState<GrupoCapacitacionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (idGrupoCapacitacion: number, body: AsignarPostulacionesGrupoRequest) => {
      setLoading(true);
      setError(null);
      try {
        const result = await postulacionesApi.asignarPostulacionesAGrupo(
          idGrupoCapacitacion,
          body
        );
        setData(result);
        return result;
      } catch (err: unknown) {
        const message = getErrorMessage(err, 'Error al asignar postulaciones al grupo');
        setError(message);
        console.error('useAsignarPostulacionesAGrupo:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { data, loading, error, execute };
}

export function useActualizarPostulacionGrupo() {
  const [data, setData] = useState<GrupoCapacitacionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (
      idGrupoCapacitacion: number,
      idPostulacion: number,
      body: ActualizarAsignacionPostulacionRequest
    ) => {
      setLoading(true);
      setError(null);
      try {
        const result = await postulacionesApi.actualizarPostulacionEnGrupoCapacitacion(
          idGrupoCapacitacion,
          idPostulacion,
          body
        );
        setData(result);
        return result;
      } catch (err: unknown) {
        const message = getErrorMessage(err, 'Error al actualizar postulación en grupo');
        setError(message);
        console.error('useActualizarPostulacionGrupo:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { data, loading, error, execute };
}

export function useDetalleGrupoCapacitacion() {
  const [data, setData] = useState<GrupoCapacitacionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (idGrupoCapacitacion: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await postulacionesApi.obtenerGrupoCapacitacionPorId(
        idGrupoCapacitacion
      );
      setData(result);
      return result;
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error al cargar detalle de grupo');
      setError(message);
      console.error('useDetalleGrupoCapacitacion:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, execute };
}

export function useGruposCapacitacion(options?: { enabled?: boolean }) {
  const [data, setData] = useState<GrupoCapacitacionResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await postulacionesApi.obtenerGruposCapacitacion();
      setData(result);
      return result;
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error al cargar grupos de capacitación');
      setError(message);
      console.error('useGruposCapacitacion:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (options?.enabled === false) return;
    execute().catch(() => undefined);
  }, [execute, options?.enabled]);

  const refetch = useCallback(() => execute(), [execute]);

  return { data, loading, error, execute, refetch };
}

