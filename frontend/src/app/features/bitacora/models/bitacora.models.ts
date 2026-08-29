import {
  Etapa,
  LeadDatosPreventaRequest,
  LeadDireccionRequest,
  LeadOfertaComercialRequest
} from '../../../shared/models/preventa/preventa.models';

/** Fila del buscador total de la Bitácora (espejo de LeadCorreccionBusquedaResponse del backend). */
export interface BitacoraBusquedaResponse {
  idLead: number;
  lead?: string | null;
  usermeta?: string | null;
  numeroDocumento?: string | null;
  celular?: string | null;
  titularServicio?: string | null;
  createdAt?: string | null;
  lastEntryAt?: string | null;
  etapa?: Etapa | string | null;
  codigoTipificacionActual?: string | null;
  codigoSubtipificacionActual?: string | null;
  idEquipo?: number | null;
  nombreProveedor?: string | null;
}

/**
 * Payload de una gestión completa de corrección (submit atómico). Cada bloque es opcional: solo se
 * envía el que cambió. `resumenCambios` es el texto legible que arma el frontend y queda como
 * comentario del evento CORRECCION.
 */
export interface BitacoraCorreccionRequest {
  datosPreventa?: LeadDatosPreventaRequest | null;
  direccion?: LeadDireccionRequest | null;
  ofertaComercial?: LeadOfertaComercialRequest | null;
  idsEventosAEliminar?: number[] | null;
  motivo?: string | null;
  resumenCambios?: string | null;
}

/** Tipos de evento que la Bitácora deja filtrar en el historial (espejo del enum Accion del backend). */
export type BitacoraAccion =
  | 'REGISTRO'
  | 'NUEVA_OPORTUNIDAD'
  | 'ASIGNACION'
  | 'CONTACTO'
  | 'TIPIFICACION'
  | 'ACTUALIZACION_DATOS_PREVENTA'
  | 'ACTUALIZACION_DIRECCION'
  | 'ACTUALIZACION_OFERTA_COMERCIAL'
  | 'VALIDACION'
  | 'CORRECCION';

/** Un cambio de campo listado en el acta de confirmación (antes → después). */
export interface BitacoraFieldChange {
  label: string;
  antes: string;
  despues: string;
}
