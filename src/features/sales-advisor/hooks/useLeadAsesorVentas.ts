import { useState, useCallback } from 'react';
import { LeadsRepository } from '@shared/api';
import type { LeadAsesorDetalleResponse } from '@shared/types';

/**
 * @deprecated Usar hooks basados en React Query (useBandejaLeads y mutaciones).
 * Hook legacy para operaciones de detalle/mutación de Asesor de Ventas.
 */
export const useLeadAsesorVentas = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detalleActual, setDetalleActual] = useState<LeadAsesorDetalleResponse | null>(null);

  // Fetch detalle del lead
  const fetchDetalle = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await LeadsRepository.getDetalleAsesor(id);
      setDetalleActual(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar detalle');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar datos preventa
  const updatePreventa = useCallback(
    async (
      idLead: number,
      payload: Parameters<typeof LeadsRepository.updateDatosPreventa>[1],
    ) => {
      setLoading(true);
      setError(null);
      try {
        await LeadsRepository.updateDatosPreventa(idLead, payload);
        // Refetch detalle
        await fetchDetalle(idLead);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al actualizar preventa');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchDetalle],
  );

  // Actualizar dirección
  const updateDireccion = useCallback(
    async (
      idLead: number,
      payload: Parameters<typeof LeadsRepository.updateDireccion>[1],
    ) => {
      setLoading(true);
      setError(null);
      try {
        await LeadsRepository.updateDireccion(idLead, payload);
        // Refetch detalle
        await fetchDetalle(idLead);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al actualizar dirección');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchDetalle],
  );

  // Actualizar oferta comercial
  const updateOferta = useCallback(
    async (
      idLead: number,
      payload: Parameters<typeof LeadsRepository.updateOfertaComercial>[1],
    ) => {
      setLoading(true);
      setError(null);
      try {
        await LeadsRepository.updateOfertaComercial(idLead, payload);
        // Refetch detalle
        await fetchDetalle(idLead);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al actualizar oferta');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchDetalle],
  );

  // Tipificar lead
  const tipificarLead = useCallback(
    async (
      idLead: number,
      payload: Parameters<typeof LeadsRepository.tipificarLead>[1],
    ) => {
      setLoading(true);
      setError(null);
      try {
        await LeadsRepository.tipificarLead(idLead, payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al tipificar lead');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Registrar contacto
  const registrarContacto = useCallback(
    async (
      idLead: number,
      payload?: Parameters<typeof LeadsRepository.registrarContacto>[1],
    ) => {
      setLoading(true);
      setError(null);
      try {
        await LeadsRepository.registrarContacto(idLead, payload);
        // Refetch detalle
        await fetchDetalle(idLead);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al registrar contacto');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchDetalle],
  );

  return {
    loading,
    error,
    detalleActual,
    fetchDetalle,
    updatePreventa,
    updateDireccion,
    updateOferta,
    tipificarLead,
    registrarContacto,
  };
};
