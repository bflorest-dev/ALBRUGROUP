import { leadsHttp } from '@shared/api/httpClient';
import type {
  LeadTipificacionRequest,
  LeadDatosPreventaRequest,
  LeadDireccionRequest,
  LeadOfertaComercialRequest,
} from '@entidades/lead/types';
import type { CatalogoResponse, TipificacionResponse } from '@shared/types';

export interface Tipificacion {
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

export interface TipificacionPayload {
  codigoTipificacion: string;
  codigoSubtipificacion: string;
}

export const PreventaApi = {
  getCatalogo: () => leadsHttp.get<CatalogoResponse>(`/tipificaciones/PREVENTA/catalogo`),

  postTipificacion: (idLead: number, payload: TipificacionPayload) =>
    leadsHttp.post<void>(`/leads/${idLead}/tipificacion`, payload),

  patchDatosPreventa: (idLead: number, payload: LeadDatosPreventaRequest) =>
    leadsHttp.patch<void>(`/leads/${idLead}/datos-preventa`, payload),

  patchDireccion: (idLead: number, payload: LeadDireccionRequest) =>
    leadsHttp.patch<void>(`/leads/${idLead}/direccion`, payload),

  patchOfertaComercial: (idLead: number, payload: LeadOfertaComercialRequest) =>
    leadsHttp.patch<void>(`/leads/${idLead}/oferta-comercial`, payload),
};
