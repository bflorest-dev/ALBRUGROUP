/**
 * Tipos de dominio para Lead (GTR - Gestión de Leads)
 * Fuente: Backend Lead Service endpoints
 */

// ========== REQUEST TYPES ==========

export interface LeadIntakeRequest {
  numTelefono?: string; // opcional, formato +51987654321
  prefijo?: string;     // prefijo como +51
  lead?: string;        // número como 987654321
  idCampana: number;
  base: 'WHATSAPP' | 'MESSENGER' | 'REFERIDO' | 'MASIVO' | string;
}

export interface LeadAsignacionRequest {
  idAsesorAsignado: number; // ID del asesor
  nombreAsesorAsignado?: string; // Opcional, se puede autocompletar
}

export interface LeadDatosPreventaRequest {
  tipoDocumento?: string;
  numeroDocumentoTitularServicio?: string;
  ubigeoNacimiento?: string;
  nombreTitularServicio?: string;
  celularRegistro?: string;
  celularReferencia?: string;
  correo?: string;
  numeroDocumentoTitularCelularRegistro?: string;
  nombreTitularCelularRegistro?: string;
}

export interface LeadDireccionRequest {
  ubigeoNacimiento?: string;
  ubigeoDomicilio?: string;
  tipoDomicilio?: string;
  tipoVia?: string;
  via?: string;
  direccion?: string;
  referencia?: string;
  latitud?: number;
  longitud?: number;
  urbanizacion?: string;
  numero?: string;
  manzana?: string;
  lote?: string;
  nombreEdificio?: string;
  nombreCondominio?: string;
  piso?: string;
  interior?: string;
}

export interface LeadOfertaComercialRequest {
  idCampana?: number;
  idPlan?: number;
  idPromocion?: number;
  adicionales?: number[];
}

export interface LeadTipificacionRequest {
  codigoTipificacion: string;
  codigoSubtipificacion: string;
}

// ========== RESPONSE TYPES ==========

export interface LeadAsesorVentasResponse {
  id: number;
  fechaAsignacion: string; // ISO datetime
  prefijo: string;
  lead: string;
  nombreTitular: string;
  correo: string;
  estadoSeguimiento: string; // Estado del seguimiento del lead
}

export interface LeadAsesorDetalleResponse {
  id: number;
  fechaAsignacion: string;
  lastEntryAt?: string;
  prefijo: string;
  lead: string;
  nombreCampana: string;
  nombreProveedorCampana: string;
  base: string;
  estadoSeguimiento: string;
  idAsesorAsignado: number;
  nombreAsesorAsignado: string;
  tipoDocumento?: string;
  numeroDocumentoTitularServicio?: string;
  nombreTitular: string;
  celularRegistro?: string;
  celularReferencia?: string;
  correo?: string;
  numeroDocumentoTitularCelularRegistro?: string;
  nombreTitularCelularRegistro?: string;
  ubigeoNacimiento?: string;
  ubigeoDomicilio?: string;
  tipoDomicilio?: string;
  tipoVia?: string;
  via?: string;
  direccion?: string;
  referencia?: string;
  latitud?: number;
  longitud?: number;
  urbanizacion?: string;
  numero?: string;
  manzana?: string;
  lote?: string;
  nombreEdificio?: string;
  nombreCondominio?: string;
  piso?: string;
  interior?: string;
}

export interface LeadGtrResponse {
  id: number;
  createdAt: string; // ISO datetime
  prefijo: string;
  lead: string;
  nombreCampana: string;
  nombreProveedorCampana: string;
  base: 'WHATSAPP' | 'INSTAGRAM' | 'FIREBASE' | string;
  nombreTitular: string;
  codigoTipificacion: string;
  codigoSubtipificacion: string;
  nombreAsesorAsignado: string;
  estadoSeguimiento: 'NUEVO' | 'EN_SEGUIMIENTO' | 'CONTACTADO' | 'TIPIFICADO' | 'CERRADO' | string;
  reasignaciones: number; // Contador de reasignaciones
}

export interface EventoResponse {
  id: number;
  idLead: number;
  idCampana: number;
  idActor: number;
  nombreActor: string;
  rolActor: string;
  accion: string;
  etapa: string;
  tipificacion: string;
  subtipificacion: string;
  createdAt: string;
}

// ========== TIPOS DE DOMINIO ==========

export interface Lead {
  id: number;
  prefijo: string;
  lead: string;
  nombreCampana: string;
  base: string;
  nombreTitular: string;
  tipificacion?: string;
  subtipificacion?: string;
  asesorAsignado?: string;
  estado: string;
  reasignaciones: number;
}

export type EstadoLead = 
  | 'NUEVA'
  | 'ASIGNADA'
  | 'EN_SEGUIMIENTO'
  | 'CONTACTADA'
  | 'TIPIFICADA'
  | 'CERRADA'
  | 'PERDIDA';

export type BaseLead = 'WHATSAPP' | 'MESSENGER' | 'REFERIDO' | 'MASIVO';

// ========== ENUMS ==========

export enum EstadoSeguimiento {
  NUEVA = 'NUEVA',
  ASIGNADA = 'ASIGNADA',
  EN_SEGUIMIENTO = 'EN_SEGUIMIENTO',
  CONTACTADA = 'CONTACTADA',
  TIPIFICADA = 'TIPIFICADA',
  CERRADA = 'CERRADA',
  PERDIDA = 'PERDIDA',
}

export enum BaseLead_Enum {
  WHATSAPP = 'WHATSAPP',
  MESSENGER = 'MESSENGER',
  REFERIDO = 'REFERIDO',
  MASIVO = 'MASIVO',
}

// ========== PERMISOS (GTR Rol) ==========

export interface PermisosGTR {
  READ_CAMPANA: boolean;
  READ_ZONAS: boolean;
  READ_UBIGEO: boolean;
  READ_PLANES: boolean;
  READ_ADICIONALES: boolean;
  READ_PROMOCIONES: boolean;
  READ_TIPIFICACIONES_PREVENTA: boolean;
  CREATE_LEADS: boolean;
  ASSIGN_LEADS: boolean;
  READ_LEADS_ASESOR: boolean;
  UPDATE_LEADS_ASESOR: boolean;
  TYPIFY_LEADS: boolean;
  CONTACT_LEADS: boolean;
  READ_LEADS_GTR: boolean;
  READ_EVENTOS_LEADS: boolean;
}

export const DEFAULT_PERMISOS_GTR: PermisosGTR = {
  READ_CAMPANA: true,
  READ_ZONAS: true,
  READ_UBIGEO: true,
  READ_PLANES: true,
  READ_ADICIONALES: true,
  READ_PROMOCIONES: true,
  READ_TIPIFICACIONES_PREVENTA: true,
  CREATE_LEADS: true,
  ASSIGN_LEADS: true,
  READ_LEADS_ASESOR: true,
  UPDATE_LEADS_ASESOR: true,
  TYPIFY_LEADS: true,
  CONTACT_LEADS: true,
  READ_LEADS_GTR: true,
  READ_EVENTOS_LEADS: true,
};
