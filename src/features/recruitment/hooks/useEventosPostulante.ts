import { useQuery } from '@tanstack/react-query';
import { recruitmentHttp } from '@shared/api';

export interface EventoPostulante {
  id: number;
  idPostulacion?: number;
  etapa?: string;
  accion?: string;
  tipificacion?: string | null;
  subtipificacion?: string | null;
  modalidadContacto?: string | null;
  observacion?: string | null;
  createdAt?: string;
  fecha?: string;
}

const getEventosPostulante = async (
  postulacionId: number
): Promise<EventoPostulante[]> => {
  console.log('[useEventosPostulante] Obteniendo eventos para postulación:', postulacionId);
  const response = await recruitmentHttp.get<
    EventoPostulante[] | { content: EventoPostulante[] }
  >(`/postulaciones/${postulacionId}/eventos`);

  console.log('[useEventosPostulante] Respuesta del backend:', response.data);
  
  // Extraer eventos del formato paginado o array directo
  let eventos: EventoPostulante[] = [];
  
  if (Array.isArray(response.data)) {
    // Respuesta directa como array
    eventos = response.data;
  } else if (response.data && typeof response.data === 'object' && 'content' in response.data) {
    // Respuesta paginada con campo 'content'
    eventos = Array.isArray(response.data.content) ? response.data.content : [];
  }
  
  console.log('[useEventosPostulante] Eventos procesados:', eventos);

  return [...eventos].sort((a, b) => {
    const aTs = new Date(a.createdAt ?? a.fecha ?? 0).getTime();
    const bTs = new Date(b.createdAt ?? b.fecha ?? 0).getTime();
    return bTs - aTs;
  });
};

export const useEventosPostulante = (postulacionId: number, enabled = true) => {
  return useQuery({
    queryKey: ['postulante-eventos', postulacionId],
    queryFn: () => getEventosPostulante(postulacionId),
    enabled: enabled && postulacionId > 0,
    staleTime: 0, // Siempre considerar datos como stale para forzar refetch
    refetchOnMount: 'always', // Siempre refetch al montar
    refetchOnWindowFocus: true, // Refetch cuando la ventana recupera el foco
  });
};
