/**
 * Tipos para Oferta Laboral
 * Alineados con API backend: POST /recruitment/ofertas-laborales
 */

export type Negocio = 'FIBRA_MIXTO' | 'CLARO';

export type PuestoObjetivo =
  | 'RRHH'
  | 'RECLUTADOR'
  | 'CAPACITADOR'
  | 'DESARROLLADOR'
  | 'CONTADOR'
  | 'COMMUNITY'
  | 'MONITOR'
  | 'SUPERVISOR_VENTAS'
  | 'ASESOR_VENTAS'
  | 'SUPERVISOR_BACKOFFICE'
  | 'ASESOR_BACKOFFICE'
  | 'SUPERVISOR_GTR'
  | 'ASESOR_GTR'
  | 'SUPERVISOR_POSTVENTA'
  | 'ASESOR_POSTVENTA';

export type Horario = 'MORNING' | 'AFTERNOON';
export type ModalidadOfertaLaboral = 'PART_TIME' | 'FULL_TIME' | 'SEMI_FULL' | 'SUPER_FULL';

export type EstadoOferta = 'ACTIVO' | 'CANCELADO' | 'CERRADO' | 'COMPLETADO';

/**
 * Datos para crear una oferta laboral
 */
export interface CreateOfertaLaboralRequest {
  codigo: string;
  negocio: Negocio;
  puestoObjetivo: PuestoObjetivo;
  horario: Horario;
  modalidad: ModalidadOfertaLaboral;
  cantidadInicial: number;
  plazoInicial: string; // YYYY-MM-DD
}

/**
 * Ampliación de una oferta laboral
 */
export interface OfertaAmpliacionResponse {
  cantidad: number;
  plazo: string; // YYYY-MM-DD
  createdAt: string; // ISO 8601
}

/**
 * Respuesta de oferta laboral (GET /ofertas-laborales/activas)
 * O respuesta de POST /ofertas-laborales
 */
export interface OfertaLaboralResponse {
  id: number;
  codigo: string;
  idSolicitante: number;
  negocio: Negocio;
  puestoObjetivo: PuestoObjetivo;
  horario: Horario;
  cantidadInicial: number;
  plazoInicial: string; // YYYY-MM-DD
  estado: EstadoOferta;
  createdAt: string; // ISO 8601
  ampliaciones: OfertaAmpliacionResponse[];
}

/**
 * Datos para crear una ampliación de oferta laboral
 * POST /ofertas-laborales/{idOfertaLaboral}/ampliacion
 */
export interface CreateAmpliacionRequest {
  cantidad: number;
  plazo: string; // YYYY-MM-DD
}

/**
 * Datos para actualizar estado de oferta laboral
 * PATCH /ofertas-laborales/{ofertaId}/estado
 */
export interface UpdateEstadoOfertaRequest {
  estado: EstadoOferta;
}
