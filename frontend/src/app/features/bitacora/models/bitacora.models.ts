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
  idContacto?: number | null;
}

/** Oportunidad (lead) del mismo contacto — espejo de OportunidadHermanaResponse. */
export interface BitacoraOportunidadHermana {
  id: number;
  usermeta?: string | null;
  numeroDocumentoTitular?: string | null;
  estado?: string | null;
  etapa?: Etapa | string | null;
  nombreAsesorAsignado?: string | null;
  nombrePlanSnapshot?: string | null;
  lastEntryAt?: string | null;
}

/** Contacto (identidad) + sus oportunidades — espejo de ContactoClusterResponse. */
export interface BitacoraContactoCluster {
  idContacto?: number | null;
  prefijo?: string | null;
  lead?: string | null;
  usermeta?: string | null;
  nombreConocido?: string | null;
  oportunidades: BitacoraOportunidadHermana[];
}

/** Resultado de reubicar un lead — espejo de MoverContactoResultado. */
export interface BitacoraMoverResultado {
  idLead: number;
  idContactoOrigen?: number | null;
  idContactoDestino?: number | null;
  huerfanoEliminado: boolean;
}

/** Corrección de identidad del contacto (teléfono + usermeta). Alcance CONTACTO: sincroniza hermanas. */
export interface BitacoraIdentidadRequest {
  prefijo?: string | null;
  lead?: string | null;
  usermeta?: string | null;
}

/**
 * Payload de una gestión completa de corrección (submit atómico). Cada bloque es opcional: solo se
 * envía el que cambió. `resumenCambios` es el texto legible que arma el frontend y queda como
 * comentario del evento CORRECCION.
 */
export interface BitacoraCorreccionRequest {
  identidad?: BitacoraIdentidadRequest | null;
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
