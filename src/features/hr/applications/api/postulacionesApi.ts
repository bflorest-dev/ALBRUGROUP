/**
 * API CLIENT para Postulaciones (RRHH - Recruitment)
 * FSD: caracteristicas/rrhh/postulaciones/api
 * 
 * Centraliza llamadas HTTP a los endpoints /postulaciones/*
 * Usa recruitmentHttp con JWT Bearer token automático
 */

import { recruitmentHttp } from '@shared/api/httpClient';
import type {
  CrearPostulacionRequest,
  ActualizarPostulacionRequest,
  TipificarPostulacionRequest,
  TipificarPostulacionDirectaRequest,
  ConfirmarContratacionRequest,
  ConfirmarContratacionDirectaRequest,
  PostulacionResponse,
  PostulacionEventoResponse,
  TipificacionCatalogo,
  CrearGrupoCapacitacionRequest,
  AsignarPostulacionesGrupoRequest,
  ActualizarAsignacionPostulacionRequest,
  GrupoCapacitacionResponse,
} from '../model';

let warnedUnexpectedPostulacionesPayload = false;

function normalizePostulacionResponse(raw: any): PostulacionResponse {
  // Extraer tipificación de múltiples fuentes posibles
  const idTipificacion = 
    raw.idTipificacion ??
    raw.tipificacion_id ??
    raw.id_tipificacion ??
    raw.tipificacion?.id ??
    null;
    
  const codigoTipificacion =
    raw.codigoTipificacion ??
    raw.codigo_tipificacion ??
    raw.tipificacion?.codigo ??
    null;
    
  const idSubtipificacion =
    raw.idSubtipificacion ??
    raw.subtipificacion_id ??
    raw.id_subtipificacion ??
    raw.subtipificacion?.id ??
    null;

  const normalized = {
    ...raw,
    idTipificacion,
    codigoTipificacion,
    idSubtipificacion,
    tipificacion: (idTipificacion || codigoTipificacion)
      ? {
          id: idTipificacion,
          codigo: codigoTipificacion,
          descripcion: raw.tipificacion?.descripcion ?? null,
        }
      : null,
    etapaProceso:
      raw.etapaProceso ??
      raw.etapa ??
      raw.etapa_proceso ??
      '',
    estadoProceso:
      raw.estadoProceso ??
      raw.estado ??
      raw.estado_proceso ??
      '',
    estadoBandeja:
      raw.estadoBandeja ??
      raw.estado_bandeja ??
      '',
    idOfertaLaboral:
      raw.idOfertaLaboral ?? raw.ofertaLaboral?.id ?? raw.oferta_laboral_id ?? 0,
    ofertaLaboral: raw.ofertaLaboral ?? raw.oferta_laboral,
    fechaCreacion:
      raw.fechaCreacion ?? raw.createdAt ?? raw.created_at ?? '',
    fechaActualizacion:
      raw.fechaActualizacion ?? raw.updatedAt ?? raw.updated_at ?? '',
    postulante: {
      id: raw.postulante?.id ?? 0,
      nombres: raw.postulante?.nombres ?? '',
      apellidos: raw.postulante?.apellidos ?? '',
      tipoDocumento: raw.postulante?.tipoDocumento ?? raw.postulante?.tipo_documento ?? '',
      documento: raw.postulante?.documento ?? '',
      celular: raw.postulante?.celular ?? '',
      fechaNacimiento: raw.postulante?.fechaNacimiento ?? raw.postulante?.fecha_nacimiento ?? '',
      listaNegra: raw.postulante?.listaNegra ?? raw.postulante?.lista_negra ?? false,
    },
  };
  
  // Log detallado para debugging
  if (import.meta.env.DEV) {
    console.log('[normalizePostulacionResponse] Raw:', {
      id: raw.id,
      etapaProceso: raw.etapaProceso,
      etapa: raw.etapa,
      estadoProceso: raw.estadoProceso,
      estado: raw.estado,
      estadoBandeja: raw.estadoBandeja,
      estado_bandeja: raw.estado_bandeja,
      tipificacion: raw.tipificacion,
      idTipificacion: raw.idTipificacion,
      codigoTipificacion: raw.codigoTipificacion,
    });
    console.log('[normalizePostulacionResponse] Normalized:', {
      id: normalized.id,
      etapaProceso: normalized.etapaProceso,
      estadoProceso: normalized.estadoProceso,
      estadoBandeja: normalized.estadoBandeja,
      tipificacion: normalized.tipificacion,
      idTipificacion: normalized.idTipificacion,
      codigoTipificacion: normalized.codigoTipificacion,
    });
  }
  
  return normalized;
}

const asArray = <T>(value: unknown): T[] | null => {
  return Array.isArray(value) ? (value as T[]) : null;
};

function extractPostulacionArray(rawPayload: unknown): unknown[] {
  const directArray = asArray<unknown>(rawPayload);
  if (directArray) return directArray;

  if (!rawPayload || typeof rawPayload !== 'object') {
    return [];
  }

  const payload = rawPayload as Record<string, unknown>;
  const directCandidates = [
    payload.content,
    payload.items,
    payload.results,
    payload.postulaciones,
    payload.rows,
  ];

  for (const candidate of directCandidates) {
    const candidateArray = asArray<unknown>(candidate);
    if (candidateArray) {
      return candidateArray;
    }
  }

  const data = payload.data;
  const dataArray = asArray<unknown>(data);
  if (dataArray) {
    return dataArray;
  }

  if (data && typeof data === 'object') {
    const nested = data as Record<string, unknown>;
    const nestedCandidates = [
      nested.content,
      nested.items,
      nested.results,
      nested.postulaciones,
      nested.rows,
    ];

    for (const candidate of nestedCandidates) {
      const candidateArray = asArray<unknown>(candidate);
      if (candidateArray) {
        return candidateArray;
      }
    }
  }

  if (import.meta.env.DEV && !warnedUnexpectedPostulacionesPayload) {
    warnedUnexpectedPostulacionesPayload = true;
    console.warn('[postulacionesApi] Unexpected postulaciones payload shape:', rawPayload);
  }

  return [];
}

function normalizePostulacionArray(rawPayload: unknown): PostulacionResponse[] {
  return extractPostulacionArray(rawPayload).map(normalizePostulacionResponse);
}

/**
 * ────────────────────────────────────────────────────────────
 * POSTULACIONES — CRUD
 * ────────────────────────────────────────────────────────────
 */

/**
 * POST /postulaciones
 * Crear nueva postulación
 */
export async function crearPostulacion(
  body: CrearPostulacionRequest
): Promise<PostulacionResponse> {
  const response = await recruitmentHttp.post<PostulacionResponse>(
    '/postulaciones',
    body
  );
  return normalizePostulacionResponse(response.data);
}

/**
 * PUT /postulaciones/{id}
 * Actualizar postulación existente
 */
export async function actualizarPostulacion(
  id: number,
  body: ActualizarPostulacionRequest
): Promise<PostulacionResponse> {
  const response = await recruitmentHttp.put<PostulacionResponse>(
    `/postulaciones/${id}`,
    body
  );
  return normalizePostulacionResponse(response.data);
}

/**
 * GET /postulaciones/{id}
 * Obtener detalle de una postulación
 */
export async function obtenerPostulacionPorId(
  id: number
): Promise<PostulacionResponse> {
  const response = await recruitmentHttp.get<PostulacionResponse>(
    `/postulaciones/${id}`
  );
  return normalizePostulacionResponse(response.data);
}

/**
 * GET /postulaciones/{id}/eventos
 * Obtener eventos de una postulación
 * 
 * NOTA: El backend devuelve respuesta paginada con estructura:
 * { content: [...], page, size, totalPages, totalElements }
 */
export async function obtenerEventosPostulacion(
  id: number
): Promise<PostulacionEventoResponse[]> {
  console.log('[postulacionesApi] Obteniendo eventos para postulación:', id);
  const response = await recruitmentHttp.get<
    PostulacionEventoResponse[] | { content: PostulacionEventoResponse[] }
  >(`/postulaciones/${id}/eventos`);
  
  console.log('[postulacionesApi] Respuesta de eventos:', response.data);
  
  // Extraer eventos del formato paginado o array directo
  let eventos: PostulacionEventoResponse[] = [];
  
  if (Array.isArray(response.data)) {
    // Respuesta directa como array
    eventos = response.data;
  } else if (response.data && typeof response.data === 'object' && 'content' in response.data) {
    // Respuesta paginada con campo 'content'
    eventos = Array.isArray(response.data.content) ? response.data.content : [];
  }
  
  console.log('[postulacionesApi] Eventos procesados:', eventos);
  return eventos;
}

/**
 * ────────────────────────────────────────────────────────────
 * TIPIFICACIÓN (Clasificación en el proceso)
 * ────────────────────────────────────────────────────────────
 */

/**
 * GET /tipificaciones/{etapa}/catalogo
 * Obtener catálogo de tipificaciones para una etapa
 */
type TipificacionesCatalogoApiResponse =
  | TipificacionCatalogo[]
  | {
      etapa?: string;
      tipificaciones?: TipificacionCatalogo[];
    }
  | {
      data?: {
        tipificaciones?: TipificacionCatalogo[];
      };
    };

function normalizeCatalogoPayload(
  payload: TipificacionesCatalogoApiResponse
): TipificacionCatalogo[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    payload &&
    'tipificaciones' in payload &&
    Array.isArray(payload.tipificaciones)
  ) {
    return payload.tipificaciones;
  }

  if (
    payload &&
    'data' in payload &&
    payload.data &&
    Array.isArray(payload.data.tipificaciones)
  ) {
    return payload.data.tipificaciones;
  }

  return [];
}

export async function obtenerCatalogoTipificaciones(
  etapa: string
): Promise<TipificacionCatalogo[]> {
  try {
    const response = await recruitmentHttp.get<TipificacionesCatalogoApiResponse>(
      `/tipificaciones/${etapa}/catalogo`
    );
    return normalizeCatalogoPayload(response.data);
  } catch {
    const fallbackResponse = await recruitmentHttp.get<TipificacionesCatalogoApiResponse>(
      '/catalogo/tipificaciones',
      { params: { etapa } }
    );
    const normalized = normalizeCatalogoPayload(fallbackResponse.data);
    if (normalized.length === 0) {
      console.warn(
        '[postulacionesApi] Unexpected tipificaciones catalog payload:',
        fallbackResponse.data
      );
    }
    return normalized;
  }
}

/**
 * POST /postulaciones/{id}/tipificacion
 * Tipificar (clasificar) una postulación
 */
export async function tipificarPostulacion(
  id: number,
  body: TipificarPostulacionRequest
): Promise<PostulacionResponse> {
  console.log('[postulacionesApi] Tipificando postulación:', { id, body });
  const response = await recruitmentHttp.post<PostulacionResponse>(
    `/postulaciones/${id}/tipificacion`,
    body
  );
  console.log('[postulacionesApi] Respuesta de tipificación:', response.data);
  return normalizePostulacionResponse(response.data);
}

/**
 * Compatibilidad para callers legacy.
 * Usa solo POST /postulaciones/{id}/tipificacion.
 */
export async function tipificarPostulacionDirecta(
  body: TipificarPostulacionDirectaRequest
): Promise<PostulacionResponse> {
  return tipificarPostulacion(body.idPostulacion, body);
}

/**
 * ────────────────────────────────────────────────────────────
 * CONTRATACIÓN
 * ────────────────────────────────────────────────────────────
 */

/**
 * POST /postulaciones/{id}/confirmar-contratacion
 * Confirmar contratación de un postulante
 */
export async function confirmarContratacion(
  id: number,
  body: ConfirmarContratacionRequest
): Promise<PostulacionResponse> {
  const response = await recruitmentHttp.post<PostulacionResponse>(
    `/postulaciones/${id}/confirmar-contratacion`,
    body
  );
  return normalizePostulacionResponse(response.data);
}

/**
 * POST /postulaciones/confirmar-contratacion
 * Confirmar contratación usando endpoint directo
 */
export async function confirmarContratacionDirecta(
  body: ConfirmarContratacionDirectaRequest
): Promise<PostulacionResponse> {
  try {
    const response = await recruitmentHttp.post<PostulacionResponse>(
      '/postulaciones/confirmar-contratacion',
      body
    );
    return normalizePostulacionResponse(response.data);
  } catch {
    return confirmarContratacion(body.idPostulacion, body);
  }
}

/**
 * ────────────────────────────────────────────────────────────
 * BANDEJAS (Estados de trabajo por etapa)
 * ────────────────────────────────────────────────────────────
 */

/**
 * GET /postulaciones/bandeja/reclutamiento
 * Obtener postulaciones en etapa de reclutamiento
 */
export async function obtenerBandejaReclutamiento(
  params?: { estadoBandeja?: string }
): Promise<PostulacionResponse[]> {
  console.log('[postulacionesApi] Obteniendo bandeja reclutamiento con params:', params);
  const response = await recruitmentHttp.get<unknown>(
    '/postulaciones/bandeja/reclutamiento',
    { params }
  );
  console.log('[postulacionesApi] Respuesta bandeja reclutamiento:', response.data);
  const normalized = normalizePostulacionArray(response.data);
  console.log('[postulacionesApi] Postulaciones normalizadas:', normalized);
  return normalized;
}

/**
 * GET /postulaciones/bandeja/capacitacion
 * Obtener postulaciones en etapa de capacitación
 * Params: sinGrupo (boolean) - filtro opcional
 */
export async function obtenerBandejaCapacitacion(
  params?: { sinGrupo?: boolean }
): Promise<PostulacionResponse[]> {
  const response = await recruitmentHttp.get<unknown>(
    '/postulaciones/bandeja/capacitacion',
    { params }
  );
  return normalizePostulacionArray(response.data);
}

/**
 * GET /postulaciones/bandeja/contratacion
 * Obtener postulaciones en etapa de contratación
 */
export async function obtenerBandejaContratacion(): Promise<PostulacionResponse[]> {
  const response = await recruitmentHttp.get<unknown>(
    '/postulaciones/bandeja/contratacion'
  );
  return normalizePostulacionArray(response.data);
}

/**
 * GET /postulaciones
 * Obtener listado general de postulaciones
 */
export async function obtenerPostulaciones(): Promise<PostulacionResponse[]> {
  const response = await recruitmentHttp.get<unknown>('/postulaciones');
  return normalizePostulacionArray(response.data);
}

/**
 * GET /grupos-capacitacion
 * Obtener listado de grupos de capacitación
 */
export async function obtenerGruposCapacitacion(): Promise<GrupoCapacitacionResponse[]> {
  const response = await recruitmentHttp.get<{
    content: GrupoCapacitacionResponse[];
    page: number;
    size: number;
    totalPages: number;
    totalElements: number;
  }>('/grupos-capacitacion');
  
  console.log('📊 [obtenerGruposCapacitacion] Response:', response.data);
  
  // El API devuelve respuesta paginada, extraemos el content
  if (response.data && typeof response.data === 'object' && 'content' in response.data) {
    const grupos = Array.isArray(response.data.content) ? response.data.content : [];
    console.log('✅ [obtenerGruposCapacitacion] Grupos extraídos:', grupos.length);
    return grupos;
  }
  
  // Fallback: si devuelve array directo (por compatibilidad)
  if (Array.isArray(response.data)) {
    console.log('✅ [obtenerGruposCapacitacion] Array directo:', response.data.length);
    return response.data;
  }
  
  console.warn('⚠️ [obtenerGruposCapacitacion] Formato inesperado:', response.data);
  return [];
}

/**
 * POST /grupos-capacitacion
 */
export async function crearGrupoCapacitacion(
  body: CrearGrupoCapacitacionRequest
): Promise<GrupoCapacitacionResponse> {
  const response = await recruitmentHttp.post<GrupoCapacitacionResponse>(
    '/grupos-capacitacion',
    body
  );
  return response.data;
}

/**
 * GET /grupos-capacitacion/{idGrupoCapacitacion}
 */
export async function obtenerGrupoCapacitacionPorId(
  idGrupoCapacitacion: number
): Promise<GrupoCapacitacionResponse> {
  const response = await recruitmentHttp.get<GrupoCapacitacionResponse>(
    `/grupos-capacitacion/${idGrupoCapacitacion}`
  );
  return response.data;
}

/**
 * POST /grupos-capacitacion/{idGrupoCapacitacion}/postulaciones
 */
export async function asignarPostulacionesAGrupo(
  idGrupoCapacitacion: number,
  body: AsignarPostulacionesGrupoRequest
): Promise<GrupoCapacitacionResponse> {
  const response = await recruitmentHttp.post<GrupoCapacitacionResponse>(
    `/grupos-capacitacion/${idGrupoCapacitacion}/postulaciones`,
    body
  );
  return response.data;
}

/**
 * PATCH /grupos-capacitacion/{idGrupoCapacitacion}/postulaciones/{idPostulacion}
 */
export async function actualizarPostulacionEnGrupoCapacitacion(
  idGrupoCapacitacion: number,
  idPostulacion: number,
  body: ActualizarAsignacionPostulacionRequest
): Promise<GrupoCapacitacionResponse> {
  const response = await recruitmentHttp.patch<GrupoCapacitacionResponse>(
    `/grupos-capacitacion/${idGrupoCapacitacion}/postulaciones/${idPostulacion}`,
    body
  );
  return response.data;
}
