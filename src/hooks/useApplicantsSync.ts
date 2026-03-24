/**
 * useApplicantsSync
 *
 * ANTES: leía de ApplicantsContext → localStorage
 * AHORA: llama al backend real vía ApplicantRepository
 *
 * Mantiene la misma interfaz que antes ({ applicants, syncVersion })
 * para que ApplicantsDashboard no necesite cambios adicionales.
 */

import { useState, useEffect, useCallback } from 'react';
import { ApplicantRepository } from '@compartido/api';
import { adaptPostulanteResponseToApplicant } from '@compartido/tipos';
import type { Applicant } from '@compartido/tipos';
import type { ApiError } from '@compartido/api';

interface UseApplicantsSyncReturn {
  applicants: Applicant[];
  loading: boolean;
  error: string | null;
  syncVersion: number;
  recargar: () => void;
}

/**
 * @param etapa - La etapa del proceso a cargar (default: 'RECLUTAMIENTO')
 */
export const useApplicantsSync = (
  etapa: 'RECLUTAMIENTO' | 'CAPACITACION' | 'GESTION' | 'CONTRATADO' = 'RECLUTAMIENTO'
): UseApplicantsSyncReturn => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncVersion, setSyncVersion] = useState(0);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let raw;
      if (etapa === 'RECLUTAMIENTO') {
        // Usa el endpoint dedicado GET /postulantes/reclutamiento
        raw = await ApplicantRepository.getReclutamiento();
      } else if (etapa === 'CAPACITACION') {
        // Usa el endpoint dedicado GET /postulantes/capacitacion
        raw = await ApplicantRepository.getCapacitacion();
      } else {
        // Usa el endpoint genérico GET /postulantes?etapa=...
        raw = await ApplicantRepository.getByEtapa(etapa);
      }
      setApplicants(raw.map(adaptPostulanteResponseToApplicant));
      setSyncVersion(v => v + 1);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Error al cargar postulantes');
    } finally {
      setLoading(false);
    }
  }, [etapa]);

  // Cargar al montar
  useEffect(() => {
    cargar();
  }, [cargar]);

  return { applicants, loading, error, syncVersion, recargar: cargar };
};