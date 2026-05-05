/**
 * TYPE DEFINITIONS para Postulaciones (RRHH - Recruitment)
 * FSD: caracteristicas/rrhh/postulaciones/model
 * 
 * Contratos de request/response con el backend
 * Importa enums desde shared/backendEnums
 */

import type {
  Origen,
  TipoDocumento,
  ModalidadContacto,
  EtapaProceso,
  EstadoProceso,
  EstadoBandeja,
} from '@shared/types/backendEnums';
import type { OfertaLaboralResponse } from '@shared/types/ofertaLaboral';

/**
 * ────────────────────────────────────────────────────────────
 * REQUEST TYPES (lo que enviamos al backend)
 * ────────────────────────────────────────────────────────────
 */

export interface PostulanteInput {
  nombres: string;
  apellidos: string;
  tipoDocumento: TipoDocumento | string;
  documento: string;
  celular: string;
  fechaNacimiento: string; // ISO date string (YYYY-MM-DD)
}

export interface CrearPostulacionRequest {
  idOfertaLaboral: number;
  origen: Origen | string;
  postulante: PostulanteInput;
}

export type ActualizarPostulacionRequest = CrearPostulacionRequest;

export interface TipificarPostulacionRequest {
  idTipificacion: number;
  idSubtipificacion: number;
  modalidadContacto?: ModalidadContacto | string;
  observacion: string;
}

export interface ConfirmarContratacionRequest {
  idEmpleadoContratado: number;
  fechaContratacion: string; // ISO date string (YYYY-MM-DD)
}

export interface ConfirmarContratacionDirectaRequest
  extends ConfirmarContratacionRequest {
  idPostulacion: number;
}

export interface TipificarPostulacionDirectaRequest
  extends TipificarPostulacionRequest {
  idPostulacion: number;
}

export interface CrearGrupoCapacitacionRequest {
  nombre: string;
  descripcion?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface AsignarPostulacionesGrupoRequest {
  idPostulaciones?: number[];
  idPostulacion?: number;
  fechaAsignacion?: string;
}

export interface ActualizarAsignacionPostulacionRequest {
  estado: string;
  observacion?: string;
}

/**
 * ────────────────────────────────────────────────────────────
 * RESPONSE TYPES (lo que recibimos del backend)
 * ────────────────────────────────────────────────────────────
 */

export type PostulanteResponse = {
  id: number;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  documento: string;
  celular: string;
  fechaNacimiento: string;
  listaNegra?: boolean;
};

export interface PostulacionResponse {
  id: number;
  idGrupoCapacitacion?: number;
  idEmpleadoRegistrador?: number;
  idOfertaLaboral: number;
  idTipificacion?: number | null;
  codigoTipificacion?: string | null;
  idSubtipificacion?: number | null;
  tipificacion?: {
    id?: number | null;
    codigo?: string | null;
    descripcion?: string | null;
  } | null;
  origen: string;
  etapaProceso: string;
  estadoProceso: string;
  estadoBandeja: string;
  postulante: PostulanteResponse;
  ofertaLaboral?: OfertaLaboralResponse;
  fechaCreacion: string; // ISO datetime
  fechaActualizacion: string; // ISO datetime
}

export interface PostulacionEventoResponse {
  id: number;
  tipo?: string;
  etapa?: string;
  descripcion: string;
  fecha: string;
  createdAt?: string;
  usuario?: string;
  accion?: string;
  tipificacion?: string;
  subtipificacion?: string;
  modalidadContacto?: string;
  observacion?: string;
}

export interface GrupoCapacitacionResponse {
  id: number;
  nombre: string;
  codigo?: string;
  idCapacitador?: number;
  turno?: string;
  sala?: string;
  descripcion?: string;
  fechaInicio?: string;
  fechaFin?: string;
  estado?: string;
  postulaciones?: PostulacionResponse[];
  detalles?: Array<{
    id: number;
    estadoCapacitacion?: string;
    fechaAsignacion?: string;
    fechaResultado?: string | null;
    postulacion?: PostulacionResponse;
  }>;
}

/**
 * Catálogo de tipificaciones (para modales/selects)
 */
export interface TipificacionCatalogo {
  id: number;
  codigo: string;
  descripcion: string;
  orden: number;
  subtipificaciones: Array<{
    id: number;
    codigo: string;
    descripcion: string;
    orden: number;
  }>;
}

/**
 * ────────────────────────────────────────────────────────────
 * DOMAIN TYPES (uso interno en la app)
 * ────────────────────────────────────────────────────────────
 */

export interface OfertaLaboralSimple {
  id: number;
  codigo: string;
  titulo?: string;
}

/**
 * Estado de carga genérico para hooks
 */
export interface LoadingState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}
