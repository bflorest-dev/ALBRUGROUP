import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createAmpliacionOferta,
  createOfertaLaboral,
  updateEstadoOferta,
} from '@entities/job-offer/api/ofertasLaborales';
import type {
  CreateAmpliacionRequest,
  CreateOfertaLaboralRequest,
  UpdateEstadoOfertaRequest,
} from '@shared/types';
import { OFERTAS_LABORALES_QUERY_KEY } from './useOfertasLaborales';

interface CreateAmpliacionPayload {
  ofertaId: number;
  payload: CreateAmpliacionRequest;
}

interface UpdateEstadoPayload {
  ofertaId: number;
  payload: UpdateEstadoOfertaRequest;
}

export const useMutateOfertasLaborales = () => {
  const queryClient = useQueryClient();

  const invalidateOfertas = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: OFERTAS_LABORALES_QUERY_KEY });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateOfertaLaboralRequest) => createOfertaLaboral(payload),
    onSuccess: invalidateOfertas,
  });

  const ampliarMutation = useMutation({
    mutationFn: ({ ofertaId, payload }: CreateAmpliacionPayload) =>
      createAmpliacionOferta(ofertaId, payload),
    onSuccess: invalidateOfertas,
  });

  const actualizarEstadoMutation = useMutation({
    mutationFn: ({ ofertaId, payload }: UpdateEstadoPayload) =>
      updateEstadoOferta(ofertaId, payload),
    onSuccess: invalidateOfertas,
  });

  return {
    createMutation,
    ampliarMutation,
    actualizarEstadoMutation,
  };
};
