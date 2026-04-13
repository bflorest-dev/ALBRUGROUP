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
  const response = await recruitmentHttp.get<EventoResponse[]>(
    `/postulaciones/${postulacionId}/eventos`
  );
  const eventos = Array.isArray(response.data) ? response.data : [];

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

  return {
    id: ultimoEvento?.idTipificacion ?? null,
    codigo: ultimoEvento?.tipificacion ?? ultimoEvento?.codigoTipificacion ?? null,
  };
};

export const useUltimaTipificacion = (postulacionId: number) => {
  return useQuery({
    queryKey: ['tipificacion', postulacionId],
    queryFn: () => getUltimaTipificacion(postulacionId),
    staleTime: 5 * 60 * 1000,
    enabled: Number.isFinite(postulacionId) && postulacionId > 0,
  });
};
