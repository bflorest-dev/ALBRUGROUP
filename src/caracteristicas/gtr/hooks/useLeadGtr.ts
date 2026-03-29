import { useState, useCallback } from 'react';
import { LeadsRepository } from '@shared/api';
import type { LeadGtrResponse } from '@shared/types';

/**
 * Hook para manejo de operaciones GTR (Intake + Asignación)
 */
export const useLeadGtr = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadsBandeja, setLeadsBandeja] = useState<LeadGtrResponse[]>([]);

  // Fetch bandeja GTR
  const fetchBandejaGtr = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await LeadsRepository.getBandejaGtr();
      setLeadsBandeja(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar bandeja GTR');
    } finally {
      setLoading(false);
    }
  }, []);

  // Intake de nuevo lead
  const intakeLead = useCallback(
    async (payload: Parameters<typeof LeadsRepository.intakeLead>[0]) => {
      setLoading(true);
      setError(null);
      try {
        await LeadsRepository.intakeLead(payload);
        // Refetch bandeja después de intake
        await fetchBandejaGtr();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al registrar lead');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchBandejaGtr],
  );

  // Asignar lead
  const asignarLead = useCallback(
    async (
      idLead: number,
      payload: Parameters<typeof LeadsRepository.asignarLead>[1],
    ) => {
      setLoading(true);
      setError(null);
      try {
        await LeadsRepository.asignarLead(idLead, payload);
        // Refetch bandeja después de asignación
        await fetchBandejaGtr();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al asignar lead');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchBandejaGtr],
  );

  return {
    loading,
    error,
    leadsBandeja,
    fetchBandejaGtr,
    intakeLead,
    asignarLead,
  };
};
