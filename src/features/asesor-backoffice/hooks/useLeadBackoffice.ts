import { useState, useCallback } from 'react';
import { LeadsRepository } from '@shared/api';
import type { LeadGtrResponse } from '@shared/types';

/**
 * Hook para manejo de operaciones Asesor Backoffice (Post-Venta)
 */
export const useLeadBackoffice = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bandejaVentas, setBandejaVentas] = useState<LeadGtrResponse[]>([]);

  // Fetch bandeja de ventas (etapa VENTA, estado GESTIONADO)
  const fetchBandejaVentas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Para backoffice, filtramos por etapa VENTA
      const data = await LeadsRepository.getBandejaGtr({ etapa: 'VENTA' });
      setBandejaVentas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar bandeja de ventas');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    bandejaVentas,
    fetchBandejaVentas,
  };
};
