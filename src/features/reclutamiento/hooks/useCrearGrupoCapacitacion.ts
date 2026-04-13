import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  grupoCapacitacionService,
  type GrupoCapacitacionRequest,
} from '../services/grupoCapacitacionService';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export const useCrearGrupoCapacitacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GrupoCapacitacionRequest) => grupoCapacitacionService.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos-capacitacion'] });
    },
  });
};

export const getGrupoCapacitacionErrorMessage = (error: unknown): string => {
  const apiError = error as ApiError;
  return (
    apiError?.response?.data?.message ??
    apiError?.message ??
    'Error al crear grupo de capacitación'
  );
};
