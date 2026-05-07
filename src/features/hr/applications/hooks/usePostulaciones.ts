/**
 * CUSTOM HOOKS para Postulaciones
 * FSD: caracteristicas/rrhh/postulaciones/hooks
 * 
 * Maneja estado de loading, error, y data para bandejas y acciones
 * Pattern: { data, loading, error, execute, success, refetch }
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
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

  try {
    localStorage.setItem(POSTULACIONES_SYNC_STORAGE_KEY, JSON.stringify({
      source,
      timestamp: Date.now(),
    }));
  } catch {
    // Si localStorage no está disponible, la sincronización entre pestañas se omite.
  }
}

function subscribeToPostulacionesUpdates(onUpdate: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== POSTULACIONES_SYNC_STORAGE_KEY) return;
    if (!event.newValue || event.newValue === event.oldValue) return;
    onUpdate();
  };

  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener('storage', handleStorage);
  };
}

/**
 * ────────────────────────────────────────────────────────────
 * HOOK para Bandeja Reclutamiento (con React Query)
 * ────────────────────────────────────────────────────────────
 */
export function useBandejaReclutamiento(options?: BandejaHookOptions) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['bandeja-reclutamiento'],
    queryFn: () => postulacionesApi.obtenerBandejaReclutamiento(),
    staleTime: 0, // Siempre considerar datos como stale para forzar refetch
    refetchInterval: options?.refetchIntervalMs ?? DEFAULT_BACKGROUND_REFETCH_INTERVAL_MS,
    enabled: options?.enabled !== false,
  });

  const refetch = useCallback(async () => {
    // Invalidar caché y hacer refetch forzado
    await queryClient.invalidateQueries({ queryKey: ['bandeja-reclutamiento'] });
    await query.refetch();
  }, [queryClient, query]);

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    execute: refetch,
    refetch,
  };
}

/**
 * ────────────────────────────────────────────────────────────
 * HOOK para Bandeja Capacitación (con React Query)
 * ────────────────────────────────────────────────────────────
 */
export function useBandejaCapacitacion(options?: BandejaHookOptions) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['bandeja-capacitacion'],
    queryFn: () => postulacionesApi.obtenerBandejaCapacitacion(),
    staleTime: 0,
    refetchInterval: options?.refetchIntervalMs ?? DEFAULT_BACKGROUND_REFETCH_INTERVAL_MS,
    enabled: options?.enabled !== false,
  });

  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['bandeja-capacitacion'] });
    await query.refetch();
  }, [queryClient, query]);

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    execute: refetch,
    refetch,
  };
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
    } catch (err: any) {
      const message = err.message || 'Error al cargar postulaciones';
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
 * HOOK para Bandeja Contratación (con React Query)
 * ────────────────────────────────────────────────────────────
 */
export function useBandejaContratacion(options?: BandejaHookOptions) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['bandeja-contratacion'],
    queryFn: () => postulacionesApi.obtenerBandejaContratacion(),
    staleTime: 0,
    refetchInterval: options?.refetchIntervalMs ?? DEFAULT_BACKGROUND_REFETCH_INTERVAL_MS,
    enabled: options?.enabled !== false,
  });

  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['bandeja-contratacion'] });
    await query.refetch();
  }, [queryClient, query]);

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    execute: refetch,
    refetch,
  };
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
    } catch (err: any) {
      const message = err.message || 'Error al crear postulación';
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
    } catch (err: any) {
      const message = err.message || 'Error al actualizar postulación';
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
 * HOOK para Tipificar Postulación (con React Query)
 * ────────────────────────────────────────────────────────────
 */
export function useTipificarPostulacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: number; body: TipificarPostulacionRequest }) =>
      postulacionesApi.tipificarPostulacionDirecta({
        idPostulacion: params.id,
        ...params.body,
      }),
    onSuccess: (data, variables) => {
      console.log('[useTipificarPostulacion] Tipificación exitosa:', data);
      
      // Invalidar TODOS los cachés de bandejas para forzar refetch
      queryClient.invalidateQueries({ queryKey: ['bandeja-reclutamiento'] });
      queryClient.invalidateQueries({ queryKey: ['bandeja-capacitacion'] });
      queryClient.invalidateQueries({ queryKey: ['bandeja-contratacion'] });
      queryClient.invalidateQueries({ queryKey: ['ultima-tipificacion'] });
      queryClient.invalidateQueries({ queryKey: ['tipificacion'] });
      
      // CRÍTICO: Invalidar eventos y tipificación de la postulación específica
      queryClient.invalidateQueries({ queryKey: ['postulante-eventos', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['eventos-postulacion', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['ultima-tipificacion', variables.id] });
      
      // Emitir evento de actualización para sincronización entre pestañas
      emitPostulacionesUpdated('tipificar-postulacion');
    },
    onError: (error: any) => {
      console.error('[useTipificarPostulacion] Error al tipificar postulación:', error);
    },
  });
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
    } catch (err: any) {
      const message = err.message || 'Error al confirmar contratación';
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
    } catch (err: any) {
      const message = err.message || 'Error al cargar catálogo de tipificaciones';
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
    } catch (err: any) {
      const message = err.message || 'Error al cargar detalle de postulación';
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
      console.log('[useEventosPostulacion] Cargando eventos para postulación:', id);
      const result = await postulacionesApi.obtenerEventosPostulacion(id);
      console.log('[useEventosPostulacion] Eventos cargados:', result);
      setData(result);
      return result;
    } catch (err: any) {
      const message = err.message || 'Error al cargar eventos de postulación';
      setError(message);
      console.error('[useEventosPostulacion] Error:', err);
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
    } catch (err: any) {
      const message = err.message || 'Error al crear grupo de capacitación';
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { idGrupoCapacitacion: number; body: AsignarPostulacionesGrupoRequest }) =>
      postulacionesApi.asignarPostulacionesAGrupo(params.idGrupoCapacitacion, params.body),
    onSuccess: () => {
      console.log('[useAsignarPostulacionesAGrupo] Asignación exitosa');
      
      // Invalidar cachés relevantes
      queryClient.invalidateQueries({ queryKey: ['bandeja-capacitacion'] });
      queryClient.invalidateQueries({ queryKey: ['grupos-capacitacion'] });
      
      emitPostulacionesUpdated('asignar-grupo');
    },
    onError: (error: any) => {
      console.error('[useAsignarPostulacionesAGrupo] Error al asignar:', error);
    },
  });
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
      } catch (err: any) {
        const message = err.message || 'Error al actualizar postulación en grupo';
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
    } catch (err: any) {
      const message = err.message || 'Error al cargar detalle de grupo';
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
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['grupos-capacitacion'],
    queryFn: () => postulacionesApi.obtenerGruposCapacitacion(),
    staleTime: 0,
    enabled: options?.enabled !== false,
  });

  const refetch = useCallback(() => query.refetch(), [query]);

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    execute: refetch,
    refetch,
  };
}
