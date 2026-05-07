import { useQuery } from '@tanstack/react-query';
import { getOfertasLaboralesActivas } from '@entities/job-offer/api/ofertasLaborales';

export const OFERTAS_LABORALES_QUERY_KEY = ['ofertas-laborales'] as const;

interface UseOfertasLaboralesOptions {
  refetchInterval?: number | false;
}

export const useOfertasLaborales = (options?: UseOfertasLaboralesOptions) => {
  return useQuery({
    queryKey: OFERTAS_LABORALES_QUERY_KEY,
    queryFn: getOfertasLaboralesActivas,
    ...(options?.refetchInterval !== undefined
      ? { refetchInterval: options.refetchInterval }
      : {}),
  });
};
