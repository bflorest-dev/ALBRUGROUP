/**
 * Hook: useLeadsData
 * Gestiona la carga de datos de leads con manejo de loading y errores
 */

import { useState, useEffect, useCallback } from 'react';
import type { LeadDTO } from '@compartido/tipos/lead.types';

export type Lead = LeadDTO;  // Alias para compatibilidad

export interface UseLeadsDataState {
  leads: Lead[];
  isLoading: boolean;
  error: string | null;
}

export interface UseLeadsDataActions {
  refetch: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook para cargar y gestionar datos de leads con manejo de estado asincrónico
 * 
 * Funcionalidad:
 * - Carga inicial de leads desde una lista inicial (simulando API)
 * - Manejo automático de estados: loading, error, success
 * - Refetch manual para actualizar datos
 * - Limpieza de errores
 * 
 * Comportamiento:
 * - Se ejecuta una vez al montar el componente
 * - Simula un delay de 1 segundo antes de cargar
 * - Los leads iniciales se pueden proporcionar como parámetro
 * - El refetch dispara nuevamente el loading
 * 
 * TODO: Reemplazar simulación con llamada a API real (LeadService.getAll())
 * 
 * @param initialLeads - Array inicial de leads (default: [])
 * @returns UseLeadsDataState & UseLeadsDataActions:
 *   - leads: Array de leads cargado
 *   - isLoading: true mientras se cargan los datos
 *   - error: Mensaje de error si algo falló, null si todo ok
 *   - refetch: Función async para recargar los datos
 *   - clearError: Función para limpiar el estado de error
 * 
 * @example
 * const { leads, isLoading, error, refetch } = useLeadsData(mockLeads);
 * 
 * if (isLoading) return <Spinner label="Cargando leads..." />;
 * if (error) return <Alert type="error">{error}</Alert>;
 * 
 * return (
 *   <div>
 *     <LeadsTable leads={leads} />
 *     <Button onClick={refetch}>Actualizar</Button>
 *   </div>
 * );
 */
export const useLeadsData = (initialLeads: Lead[] = []): UseLeadsDataState & UseLeadsDataActions => {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Traer datos de leads (simulado - reemplazar con API real)
   */
  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Reemplazar con llamada a API real
      // const response = await LeadService.getLeads();
      // setLeads(response.data);
      
      // Simulación: esperar 1 segundo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // En producción, esto vendría del servidor
      setLeads(initialLeads);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar leads';
      setError(errorMessage);
      console.error('Error fetching leads:', err);
    } finally {
      setIsLoading(false);
    }
  }, [initialLeads]);

  /**
   * Cargar datos al montar el componente
   */
  useEffect(() => {
    fetchLeads();
  }, []);

  /**
   * Refetch: permitir al usuario intentar cargar nuevamente
   */
  const refetch = useCallback(async () => {
    await fetchLeads();
  }, [fetchLeads]);

  /**
   * Limpiar error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    leads,
    isLoading,
    error,
    refetch,
    clearError,
  };
};
