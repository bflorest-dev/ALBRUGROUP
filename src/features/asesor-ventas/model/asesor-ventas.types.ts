/**
 * ASESOR_VENTAS Types
 * Tipos para leads asignados al asesor de ventas con operaciones permitidas
 *
 * Este módulo delega el tipo desde shared/types/lead.responses
 */

import type { LeadAsesorVentasResponse as SharedLeadAsesorVentasResponse } from '@shared/types';

export type LeadAsesorVentasResponse = SharedLeadAsesorVentasResponse;

export interface ContactoRequest {
  fecha: string;
  hora: string;
  notas: string;
  resultado: 'EXITOSO' | 'NO_CONTESTO' | 'OCUPADO' | 'OTRO';
}

export interface TipificacionRequest {
  codigoTipificacion: string;
  codigoSubtipificacion?: string;
  motivo?: string;
}

export interface OfertaComercialRequest {
  idPlan: number;
  idPromocion?: number;
  precioNegoziado?: number;
  condiciones?: string;
}

export interface DireccionRequest {
  tipoVia: string;
  via: string;
  numero: string;
  departamento?: string;
  ciudad: string;
  codigoPostal?: string;
}

export interface DatosPreventa {
  nombreTitular: string;
  apellidoTitular: string;
  tipoDocumento: string;
  numeroDocumento: string;
  celularRegistro: string;
  celularReferencia?: string;
  correo: string;
  fechaNacimiento?: string;
}

export interface ContactoResponse {
  id: number;
  fecha: string;
  resultado: string;
  notas: string;
  createdAt: string;
}

export interface OfertaResponse {
  id: number;
  idPlan: number;
  idPromocion?: number;
  precioNegoziado?: number;
  estado: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';
  createdAt: string;
}

export interface DireccionResponse {
  id: number;
  tipoVia: string;
  via: string;
  numero: string;
  ciudad: string;
  verificada: boolean;
}

export interface DatosPreventaResponse extends DatosPreventa {
  id: number;
  updatedAt: string;
}
