import { rrhhHttp } from '@shared/api/httpClient';
import type {
  CreateAmpliacionRequest,
  CreateOfertaLaboralRequest,
  OfertaAmpliacionResponse,
  OfertaLaboralResponse,
  UpdateEstadoOfertaRequest,
} from '@shared/types';

const OFERTAS_BASE_PATH = '/ofertas-laborales';

export const getOfertasLaboralesActivas = async (): Promise<OfertaLaboralResponse[]> => {
  const response = await rrhhHttp.get<OfertaLaboralResponse[]>(`${OFERTAS_BASE_PATH}/activas`);
  return response.data;
};

export const createOfertaLaboral = async (
  payload: CreateOfertaLaboralRequest
): Promise<OfertaLaboralResponse> => {
  const response = await rrhhHttp.post<OfertaLaboralResponse>(OFERTAS_BASE_PATH, payload);
  return response.data;
};

export const createAmpliacionOferta = async (
  ofertaId: number,
  payload: CreateAmpliacionRequest
): Promise<OfertaAmpliacionResponse> => {
  const response = await rrhhHttp.post<OfertaAmpliacionResponse>(
    `${OFERTAS_BASE_PATH}/${ofertaId}/ampliacion`,
    payload
  );
  return response.data;
};

export const updateEstadoOferta = async (
  ofertaId: number,
  payload: UpdateEstadoOfertaRequest
): Promise<OfertaLaboralResponse> => {
  const response = await rrhhHttp.patch<OfertaLaboralResponse>(
    `${OFERTAS_BASE_PATH}/${ofertaId}/estado`,
    payload
  );
  return response.data;
};
