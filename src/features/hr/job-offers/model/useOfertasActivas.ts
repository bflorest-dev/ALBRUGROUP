/**
 * Hook personalizado para obtener ofertas laborales activas
 * Maneja carga, errores y refetch
 */

import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAmpliacionOferta,
  createOfertaLaboral,
  getOfertasLaboralesActivas,
  updateEstadoOferta,
} from '@entities/job-offer/api/ofertasLaborales';
import type {
  CreateAmpliacionRequest,
  CreateOfertaLaboralRequest,
  OfertaLaboralResponse,
  UpdateEstadoOfertaRequest,
} from '@shared/types';

export interface UseOfertasActivasReturn {
  data: OfertaLaboralResponse[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const OFERTAS_ACTIVAS_QUERY_KEY = ['ofertas-laborales'] as const;

/**
 * Hook para obtener y gestionar ofertas laborales activas
 * @returns Estado { data, isLoading, error } + función refetch
 */
export function useOfertasActivas(): UseOfertasActivasReturn {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: OFERTAS_ACTIVAS_QUERY_KEY,
    queryFn: getOfertasLaboralesActivas,
  });

  const refetch = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: OFERTAS_ACTIVAS_QUERY_KEY });
  }, [queryClient]);

  /**
   * Retornar estado + función refetch
   */
  return {
    data: data ?? null,
    isLoading,
    error: error instanceof Error ? error.message : error ? 'Error desconocido' : null,
    refetch,
  };
}

export function useCrearOfertaLaboral() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateOfertaLaboralRequest) => createOfertaLaboral(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OFERTAS_ACTIVAS_QUERY_KEY });
    },
  });
}

export function useAmpliarOfertaLaboral() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ofertaId,
      body,
    }: {
      ofertaId: number;
      body: CreateAmpliacionRequest;
    }) => createAmpliacionOferta(ofertaId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OFERTAS_ACTIVAS_QUERY_KEY });
    },
  });
}

export function useActualizarEstadoOferta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ofertaId,
      body,
    }: {
      ofertaId: number;
      body: UpdateEstadoOfertaRequest;
    }) => updateEstadoOferta(ofertaId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OFERTAS_ACTIVAS_QUERY_KEY });
    },
  });
}
