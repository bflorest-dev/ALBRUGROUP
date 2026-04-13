/**
 * CUSTOM HOOKS para Postulaciones
 * FSD: caracteristicas/rrhh/postulaciones/hooks
 * 
 * Maneja estado de loading, error, y data para bandejas y acciones
 * Pattern: { data, loading, error, execute, success, refetch }
 */

import { useState, useCallback, useEffect } from 'react';
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

let reclutamientoInFlight: Promise<void> | null = null;
let contratacionInFlight: Promise<void> | null = null;
let bandejaContratacionInFlight: Promise<void> | null = null;

/**
 * ────────────────────────────────────────────────────────────
 * HOOK para Bandeja Reclutamiento
 * ────────────────────────────────────────────────────────────
 */
export function useBandejaReclutamiento(options?: { enabled?: boolean }) {
  const [data, setData] = useState<PostulacionResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (params?: { estadoBandeja?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await postulacionesApi.obtenerBandejaReclutamiento(params);
      setData(result);
    } catch (err: any) {
      const message = err.message || 'Error al cargar bandeja de reclutamiento';
      setError(message);
      console.error('useBandejaReclutamiento:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (options?.enabled === false) return;
    if (reclutamientoInFlight) return;
    reclutamientoInFlight = execute().finally(() => {
      reclutamientoInFlight = null;
    });
  }, [execute, options?.enabled]);

  const refetch = useCallback(() => execute(), [execute]);

  return { data, loading, error, execute, refetch };
}

/**
 * ────────────────────────────────────────────────────────────
 * HOOK para Bandeja Capacitación
 * ────────────────────────────────────────────────────────────
 */
export function useBandejaCapacitacion(options?: { enabled?: boolean }) {
  const [data, setData] = useState<PostulacionResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (params?: { sinGrupo?: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await postulacionesApi.obtenerBandejaCapacitacion(params);
      setData(result);
    } catch (err: any) {
      const message = err.message || 'Error al cargar bandeja de capacitación';
      setError(message);
      console.error('useBandejaCapacitacion:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (options?.enabled === false) return;
    if (contratacionInFlight) return;
    contratacionInFlight = execute().finally(() => {
      contratacionInFlight = null;
    });
  }, [execute, options?.enabled]);

  const refetch = useCallback(() => execute(), [execute]);

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
 * HOOK para Bandeja Contratación
 * ────────────────────────────────────────────────────────────
 */
export function useBandejaContratacion(options?: { enabled?: boolean }) {
  const [data, setData] = useState<PostulacionResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await postulacionesApi.obtenerBandejaContratacion();
      setData(result);
    } catch (err: any) {
      const message = err.message || 'Error al cargar bandeja de contratación';
      setError(message);
      console.error('useBandejaContratacion:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    if (options?.enabled === false) return;
    if (bandejaContratacionInFlight) return;

    bandejaContratacionInFlight = execute().finally(() => {
      bandejaContratacionInFlight = null;
      if (ignore) return;
    });

    return () => {
      ignore = true;
    };
  }, [execute, options?.enabled]);

  const refetch = useCallback(() => execute(), [execute]);

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
      return result;
    } catch (err: any) {
      const message = err.message || 'Error al tipificar postulación';
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
      const result = await postulacionesApi.obtenerEventosPostulacion(id);
      setData(result);
      return result;
    } catch (err: any) {
      const message = err.message || 'Error al cargar eventos de postulación';
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
      } catch (err: any) {
        const message = err.message || 'Error al asignar postulaciones al grupo';
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
    } catch (err: any) {
      const message = err.message || 'Error al cargar grupos de capacitación';
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
