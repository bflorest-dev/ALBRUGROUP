/**
 * Tipos de dominio para Lead (GTR - Gestión de Leads)
 * Fuente: Backend Lead Service endpoints
 */

import type {
  LeadAsesorVentasResponse as SharedLeadAsesorVentasResponse,
  LeadAsesorDetalleResponse as SharedLeadAsesorDetalleResponse,
  LeadGtrResponse as SharedLeadGtrResponse,
  LeadTipificacionRequest as SharedLeadTipificacionRequest,
} from '@shared/types/lead.responses';
import type { EventoResponse as SharedEventoResponse } from '@shared/types/backend';

// ========== REQUEST TYPES ==========
// Using shared types for consistency
export type { LeadIntakeRequest } from '@shared/types/lead.responses';

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
  nombreMadre?: string;
  nombrePadre?: string;
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
  plano?: string;
  piso?: string;
  interior?: string;
}

export interface LeadAdicionalOferta {
  idAdicional: number;
  cantidad: number;
}

export interface LeadOfertaComercialRequest {
  idPlan: number;
  idPromocionInterna?: number;
  idPromocionProveedor?: number;
  adicionales?: LeadAdicionalOferta[];
}

export type LeadTipificacionRequest = SharedLeadTipificacionRequest;

// ========== RESPONSE TYPES ==========

export type LeadAsesorVentasResponse = SharedLeadAsesorVentasResponse;

export type LeadAsesorDetalleResponse = SharedLeadAsesorDetalleResponse;

export type LeadGtrResponse = SharedLeadGtrResponse;

export type EventoResponse = SharedEventoResponse;

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
