import { leadsHttp } from '@shared/api/httpClient';
import type {
  LeadTipificacionRequest,
  LeadDatosPreventaRequest,
  LeadDireccionRequest,
  LeadOfertaComercialRequest,
} from '@entities/lead/types';
import type { CatalogoResponse, TipificacionResponse, PlanResponse, PromocionComercialResponse } from '@shared/types';

export type Tipificacion = TipificacionResponse;

export type TipificacionPayload = LeadTipificacionRequest;

export const PreventaApi = {
  getCatalogo: () => leadsHttp.get<CatalogoResponse>(`/tipificaciones/PREVENTA/catalogo`),

  getPlanes: () => leadsHttp.get<PlanResponse[]>('/planes'),

  getPromociones: (interno: boolean) =>
    leadsHttp.get<PromocionComercialResponse[]>('/promociones', {
      params: { interno },
    }),

  postTipificacion: (idLead: number, payload: TipificacionPayload) =>
    leadsHttp.post<void>(`/leads/${idLead}/tipificacion`, payload),

  patchDatosPreventa: (idLead: number, payload: LeadDatosPreventaRequest) =>
    leadsHttp.patch<void>(`/leads/${idLead}/datos-preventa`, payload),

  patchDireccion: (idLead: number, payload: LeadDireccionRequest) =>
    leadsHttp.patch<void>(`/leads/${idLead}/direccion`, payload),

  patchOfertaComercial: (idLead: number, payload: LeadOfertaComercialRequest) =>
    leadsHttp.patch<void>(`/leads/${idLead}/oferta-comercial`, payload),
};
