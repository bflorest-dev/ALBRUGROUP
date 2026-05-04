import { leadsHttp } from '@shared/api/httpClient';
import {
  catalogoResponseSchema,
  leadCommandResponseSchema,
  parseApiResponse,
  planResponseArraySchema,
  promocionComercialResponseArraySchema,
} from '@shared/api/responseSchemas';
import type {
  LeadTipificacionRequest,
  LeadDatosPreventaRequest,
  LeadDireccionRequest,
  LeadOfertaComercialRequest,
} from '@entities/lead/types';
import type { CatalogoResponse, TipificacionResponse, PlanResponse, PromocionComercialResponse } from '@shared/types';

export type Tipificacion = TipificacionResponse;

export type TipificacionPayload = LeadTipificacionRequest;

const parseLeadCommandPayload = (payload: unknown, context: string): void => {
  if (payload === null || payload === undefined || payload === '') {
    return;
  }
  parseApiResponse(leadCommandResponseSchema, payload, context);
};

export const PreventaApi = {
  getCatalogo: async (): Promise<CatalogoResponse> => {
    const response = await leadsHttp.get<CatalogoResponse>(`/tipificaciones/PREVENTA/catalogo`);
    return parseApiResponse(catalogoResponseSchema, response.data, 'GET /tipificaciones/PREVENTA/catalogo');
  },

  getPlanes: async (): Promise<PlanResponse[]> => {
    const response = await leadsHttp.get<PlanResponse[]>('/planes');
    return parseApiResponse(planResponseArraySchema, response.data, 'GET /planes');
  },

  getPromociones: async (interno: boolean): Promise<PromocionComercialResponse[]> => {
    const response = await leadsHttp.get<PromocionComercialResponse[]>('/promociones', {
      params: { interno },
    });
    return parseApiResponse(promocionComercialResponseArraySchema, response.data, 'GET /promociones');
  },

  postTipificacion: async (idLead: number, payload: TipificacionPayload): Promise<void> => {
    const response = await leadsHttp.post(`/leads/${idLead}/tipificacion`, payload);
    parseLeadCommandPayload(response.data, 'POST /leads/{idLead}/tipificacion');
  },

  patchDatosPreventa: async (idLead: number, payload: LeadDatosPreventaRequest): Promise<void> => {
    const response = await leadsHttp.patch(`/leads/${idLead}/datos-preventa`, payload);
    parseLeadCommandPayload(response.data, 'PATCH /leads/{idLead}/datos-preventa');
  },

  patchDireccion: async (idLead: number, payload: LeadDireccionRequest): Promise<void> => {
    const response = await leadsHttp.patch(`/leads/${idLead}/direccion`, payload);
    parseLeadCommandPayload(response.data, 'PATCH /leads/{idLead}/direccion');
  },

  patchOfertaComercial: async (
    idLead: number,
    payload: LeadOfertaComercialRequest,
  ): Promise<void> => {
    const response = await leadsHttp.patch(`/leads/${idLead}/oferta-comercial`, payload);
    parseLeadCommandPayload(response.data, 'PATCH /leads/{idLead}/oferta-comercial');
  },
};
