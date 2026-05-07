import { useQuery } from '@tanstack/react-query';
import { recruitmentHttp } from '@shared/api';

interface EventoResponse {
  id: number;
  idPostulacion?: number;
  etapa?: string;
  idTipificacion?: number | null;
  tipificacion?: string | null;
  codigoTipificacion?: string | null;
  createdAt?: string;
  fecha?: string;
}

interface UltimaTipificacion {
  id: number | null;
  codigo: string | null;
}

export const getUltimaTipificacion = async (
  postulacionId: number
): Promise<UltimaTipificacion> => {
  console.log('[getUltimaTipificacion] Obteniendo última tipificación para:', postulacionId);
  
  const response = await recruitmentHttp.get<
    EventoResponse[] | { content: EventoResponse[] }
  >(`/postulaciones/${postulacionId}/eventos`);
  
  console.log('[getUltimaTipificacion] Respuesta raw:', response.data);
  
  // Extraer eventos del formato paginado o array directo
  let eventos: EventoResponse[] = [];
  
  if (Array.isArray(response.data)) {
    // Respuesta directa como array
    eventos = response.data;
  } else if (response.data && typeof response.data === 'object' && 'content' in response.data) {
    // Respuesta paginada con campo 'content'
    eventos = Array.isArray(response.data.content) ? response.data.content : [];
  }
  
  console.log('[getUltimaTipificacion] Eventos extraídos:', eventos);

  // Buscar el último evento con tipificación resoluble, independientemente de la etapa.
  const ultimoEvento = eventos
    .filter((e) => {
      const idTip = e.idTipificacion ?? null;
      const codigo = e.tipificacion ?? e.codigoTipificacion ?? null;
      return typeof idTip === 'number' || !!codigo;
    })
    .sort((a, b) => {
      const aTs = new Date(a.createdAt ?? a.fecha ?? 0).getTime();
      const bTs = new Date(b.createdAt ?? b.fecha ?? 0).getTime();
      return bTs - aTs;
    })[0];

  const result = {
    id: ultimoEvento?.idTipificacion ?? null,
    codigo: ultimoEvento?.tipificacion ?? ultimoEvento?.codigoTipificacion ?? null,
  };
  
  console.log('[getUltimaTipificacion] Última tipificación encontrada:', result);

  return result;
};

export const useUltimaTipificacion = (postulacionId: number) => {
  return useQuery({
    queryKey: ['ultima-tipificacion', postulacionId], // Key estandarizada
    queryFn: () => getUltimaTipificacion(postulacionId),
    staleTime: 0, // CRÍTICO: Cambiar a 0 para forzar refetch inmediato
    refetchOnMount: 'always', // Siempre refetch al montar
    enabled: Number.isFinite(postulacionId) && postulacionId > 0,
  });
};
