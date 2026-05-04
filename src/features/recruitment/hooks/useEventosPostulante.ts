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
  const response = await recruitmentHttp.get<EventoPostulante[]>(
    `/postulaciones/${postulacionId}/eventos`
  );

  const eventos = Array.isArray(response.data) ? response.data : [];

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
    staleTime: 60 * 1000,
  });
};
