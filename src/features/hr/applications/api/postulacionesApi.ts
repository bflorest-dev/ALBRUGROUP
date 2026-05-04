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

type RawPostulacion = Record<string, unknown>;

function getRawValue<T = unknown>(raw: RawPostulacion, key: string): T | undefined {
  return raw[key] as T | undefined;
}

function getRawObject(raw: RawPostulacion, key: string): RawPostulacion | undefined {
  const value = raw[key];
  if (value && typeof value === 'object') {
    return value as RawPostulacion;
  }
  return undefined;
}

function normalizePostulacionResponse(raw: unknown): PostulacionResponse {
  const payload = (raw as RawPostulacion) ?? {};
  const tipificacion = getRawObject(payload, 'tipificacion') ?? {};
  const postulante = getRawObject(payload, 'postulante') ?? {};

  return {
    ...(payload as unknown as PostulacionResponse),
    idTipificacion:
      getRawValue<number>(payload, 'idTipificacion') ??
      getRawValue<number>(payload, 'tipificacion_id') ??
      getRawValue<number>(payload, 'id_tipificacion') ??
      getRawValue<number>(tipificacion, 'id') ??
      null,
    codigoTipificacion:
      getRawValue<string>(payload, 'codigoTipificacion') ??
      getRawValue<string>(payload, 'codigo_tipificacion') ??
      getRawValue<string>(tipificacion, 'codigo') ??
      null,
    idSubtipificacion:
      getRawValue<number>(payload, 'idSubtipificacion') ??
      getRawValue<number>(payload, 'subtipificacion_id') ??
      getRawValue<number>(payload, 'id_subtipificacion') ??
      getRawValue<number>(getRawObject(payload, 'subtipificacion') ?? {}, 'id') ??
      null,
    tipificacion: getRawValue<unknown>(payload, 'tipificacion')
      ? {
          id:
            getRawValue<number>(tipificacion, 'id') ??
            getRawValue<number>(payload, 'idTipificacion') ??
            getRawValue<number>(payload, 'tipificacion_id') ??
            null,
          codigo:
            getRawValue<string>(tipificacion, 'codigo') ??
            getRawValue<string>(payload, 'codigoTipificacion') ??
            getRawValue<string>(payload, 'codigo_tipificacion') ??
            null,
          descripcion: getRawValue<string>(tipificacion, 'descripcion') ?? null,
        }
      : null,
    etapaProceso:
      getRawValue<string>(payload, 'etapaProceso') ??
      getRawValue<string>(payload, 'etapa') ??
      getRawValue<string>(payload, 'etapa_proceso') ??
      '',
    estadoProceso:
      getRawValue<string>(payload, 'estadoProceso') ??
      getRawValue<string>(payload, 'estado') ??
      getRawValue<string>(payload, 'estado_proceso') ??
      '',
    estadoBandeja:
      getRawValue<string>(payload, 'estadoBandeja') ??
      getRawValue<string>(payload, 'estado_bandeja') ??
      '',
    idOfertaLaboral:
      getRawValue<number>(payload, 'idOfertaLaboral') ??
      getRawValue<number>(getRawObject(payload, 'ofertaLaboral') ?? {}, 'id') ??
      getRawValue<number>(payload, 'oferta_laboral_id') ??
      0,
    ofertaLaboral:
      getRawValue<PostulacionResponse['ofertaLaboral']>(payload, 'ofertaLaboral') ??
      getRawValue<PostulacionResponse['ofertaLaboral']>(payload, 'oferta_laboral'),
    fechaCreacion:
      getRawValue<string>(payload, 'fechaCreacion') ??
      getRawValue<string>(payload, 'createdAt') ??
      getRawValue<string>(payload, 'created_at') ??
      '',
    fechaActualizacion:
      getRawValue<string>(payload, 'fechaActualizacion') ??
      getRawValue<string>(payload, 'updatedAt') ??
      getRawValue<string>(payload, 'updated_at') ??
      '',
    postulante: {
      id: getRawValue<number>(postulante, 'id') ?? 0,
      nombres: getRawValue<string>(postulante, 'nombres') ?? '',
      apellidos: getRawValue<string>(postulante, 'apellidos') ?? '',
      tipoDocumento:
        getRawValue<string>(postulante, 'tipoDocumento') ??
        getRawValue<string>(postulante, 'tipo_documento') ??
        '',
      documento: getRawValue<string>(postulante, 'documento') ?? '',
      celular: getRawValue<string>(postulante, 'celular') ?? '',
      fechaNacimiento:
        getRawValue<string>(postulante, 'fechaNacimiento') ??
        getRawValue<string>(postulante, 'fecha_nacimiento') ??
        '',
      listaNegra:
        getRawValue<boolean>(postulante, 'listaNegra') ??
        getRawValue<boolean>(postulante, 'lista_negra') ??
        false,
    },
  };
}

function extractPostulacionArrayPayload(rawPayload: unknown): unknown[] {
  if (Array.isArray(rawPayload)) {
    return rawPayload;
  }

  if (rawPayload && typeof rawPayload === 'object') {
    const payload = rawPayload as Record<string, unknown>;

    if (Array.isArray(payload.data)) {
      return payload.data;
    }

    if (Array.isArray(payload.items)) {
      return payload.items;
    }

    if (Array.isArray(payload.content)) {
      return payload.content;
    }

    if (Array.isArray(payload.postulaciones)) {
      return payload.postulaciones;
    }

    if (Array.isArray(payload.results)) {
      return payload.results;
    }

    if ('data' in payload && payload.data && typeof payload.data === 'object') {
      return extractPostulacionArrayPayload(payload.data);
    }
  }

  return [];
}

function normalizePostulacionArray(rawArray: unknown): PostulacionResponse[] {
  const payload = extractPostulacionArrayPayload(rawArray);
  if (!Array.isArray(payload)) {
    console.warn('[postulacionesApi] Expected postulacion list, received:', rawArray);
    return [];
  }

  return payload.map((item) => normalizePostulacionResponse(item));
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
 */
export async function obtenerEventosPostulacion(
  id: number
): Promise<PostulacionEventoResponse[]> {
  const response = await recruitmentHttp.get<PostulacionEventoResponse[]>(
    `/postulaciones/${id}/eventos`
  );
  return Array.isArray(response.data) ? response.data : [];
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
  const response = await recruitmentHttp.post<PostulacionResponse>(
    `/postulaciones/${id}/tipificacion`,
    body
  );
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
  const response = await recruitmentHttp.get<unknown>(
    '/postulaciones/bandeja/reclutamiento',
    { params }
  );
  return normalizePostulacionArray(response.data);
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
  const response = await recruitmentHttp.get<GrupoCapacitacionResponse[]>('/grupos-capacitacion');
  return Array.isArray(response.data) ? response.data : [];
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
