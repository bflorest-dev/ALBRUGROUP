/**
 * Hooks para queries de Eventos
 */

import { useQuery } from '@tanstack/react-query';
import { EventosApi, type EventoResponse } from '../model/eventos.api';

/**
 * Hook para obtener eventos de un lead específico
 */
export const useEventosByLead = (idLead?: number) => {
  return useQuery<EventoResponse[]>({
    queryKey: ['eventos', 'lead', idLead],
    queryFn: async () => {
      if (!idLead) return [];
      return await EventosApi.getEventosByLead(idLead);
    },
    enabled: !!idLead,
    staleTime: 1000 * 60 * 2, // 2 minutos
    retry: 2,
  });
};

/**
 * Hook para obtener eventos de un empleado específico
 */
export const useEventosByEmpleado = (
  idEmpleado?: number,
  fechaDesde?: string,
  fechaHasta?: string
) => {
  return useQuery<EventoResponse[]>({
    queryKey: ['eventos', 'empleado', idEmpleado, fechaDesde, fechaHasta],
    queryFn: async () => {
      if (!idEmpleado) return [];
      return await EventosApi.getEventosByEmpleado(idEmpleado, fechaDesde, fechaHasta);
    },
    enabled: !!idEmpleado,
    staleTime: 1000 * 60 * 2, // 2 minutos
    retry: 2,
  });
};
