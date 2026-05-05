import { recruitmentHttp } from '@shared/api';
import type {
  CreateAmpliacionRequest,
  CreateOfertaLaboralRequest,
  OfertaAmpliacionResponse,
  OfertaLaboralResponse,
  UpdateEstadoOfertaRequest,
} from '@shared/types';

const OFERTAS_BASE_PATH = '/ofertas-laborales';

export const getOfertasLaboralesActivas = async (): Promise<OfertaLaboralResponse[]> => {
  const response = await recruitmentHttp.get<OfertaLaboralResponse[]>(`${OFERTAS_BASE_PATH}/activas`);
  return response.data;
};

export const createOfertaLaboral = async (
  payload: CreateOfertaLaboralRequest
): Promise<OfertaLaboralResponse> => {
  const response = await recruitmentHttp.post<OfertaLaboralResponse>(OFERTAS_BASE_PATH, payload);
  return response.data;
};

export const createAmpliacionOferta = async (
  ofertaId: number,
  payload: CreateAmpliacionRequest
): Promise<OfertaAmpliacionResponse> => {
  const response = await recruitmentHttp.post<OfertaAmpliacionResponse>(
    `${OFERTAS_BASE_PATH}/${ofertaId}/ampliacion`,
    payload
  );
  return response.data;
};

export const updateEstadoOferta = async (
  ofertaId: number,
  payload: UpdateEstadoOfertaRequest
): Promise<OfertaLaboralResponse> => {
  const response = await recruitmentHttp.patch<OfertaLaboralResponse>(
    `${OFERTAS_BASE_PATH}/${ofertaId}/estado`,
    payload
  );
  return response.data;
};
