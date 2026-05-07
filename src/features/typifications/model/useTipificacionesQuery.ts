import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  TipificacionesApi,
  Tipificacion,
  TipificacionesCatalogoPayload,
  TipificacionEstadoPayload,
} from './tipificaciones.api';

const cacheKey = (etapa: string) => ['tipificaciones', etapa] as const;

export function useTipificacionesCatalogo(etapa: string) {
  return useQuery<Tipificacion[]>({
    queryKey: cacheKey(etapa),
    queryFn: () => TipificacionesApi.getCatalogo(etapa).then((res) => res.data),
    staleTime: 1000 * 60 * 5,
  });
}

export function usePutTipificacionesCatalogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TipificacionesCatalogoPayload) => {
      await TipificacionesApi.putCatalogo(payload);
    },
    onSuccess: (data, payload) => {
      qc.invalidateQueries({ queryKey: cacheKey(payload.etapa) });
    },
  });
}

export function usePatchTipificacionEstado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ payload }: { payload: TipificacionEstadoPayload; etapa: string }) => {
      await TipificacionesApi.patchEstado(payload);
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: cacheKey(variables.etapa) });
    },
  });
}

export type { Tipificacion };
