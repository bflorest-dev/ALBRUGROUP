/**
 * useBackofficeLeads - Hook personalizado
 * 
 * Gestiona toda la lÃ³gica de leads para ASESOR_BACKOFFICE:
 * - Listado de leads por estado (pendientes, en gestiÃ³n, completadas)
 * - BÃºsqueda y filtros
 * - TipificaciÃ³n de leads
 * - Cambio entre leads
 */

import { useState, useCallback, useMemo } from 'react';
import type { LeadDTO } from '@shared/types';
import type { TipificationFilter } from '@shared/types';

/**
 * Lead extendido con informaciÃ³n de estado
 */
interface BackofficeLead extends LeadDTO {
  tipificationStatus?: 'pending' | 'tipified';
  tipificationLabel?: string;
}

/**
 * Estado del hook
 */
interface BackofficeLeadsState {
  leads: BackofficeLead[];
  selectedLeadId: string | null;
  searchTerm: string;
  selectedFilter: TipificationFilter;
  isLoading: boolean;
  error: string | null;
}

/**
 * Respuesta del hook
 */
interface UseBackofficeLeadsReturn extends BackofficeLeadsState {
  selectedLead: BackofficeLead | null;
  pendingLeads: BackofficeLead[];
  inProgressLeads: BackofficeLead[];
  completedLeads: BackofficeLead[];
  filteredLeads: BackofficeLead[];
  stats: {
    pending: number;
    inProgress: number;
    completed: number;
  };
  selectLead: (leadId: string) => void;
  setSearchTerm: (term: string) => void;
  setFilter: (filter: TipificationFilter) => void;
  clearFilter: () => void;
  tipifyLead: (leadId: string, blockId: string, optionId: string) => void;
  getNextLead: () => BackofficeLead | null;
}

/**
 * Hook: useBackofficeLeads
 * 
 * Gestiona estado y lÃ³gica de leads para ASESOR_BACKOFFICE
 */
export const useBackofficeLeads = (initialLeads: BackofficeLead[]): UseBackofficeLeadsReturn => {
  const [state, setState] = useState<BackofficeLeadsState>({
    leads: initialLeads,
    selectedLeadId: null,
    searchTerm: '',
    selectedFilter: {},
    isLoading: false,
    error: null
  });

  // Seleccionar un lead
  const selectLead = useCallback((leadId: string) => {
    setState((prev) => ({
      ...prev,
      selectedLeadId: leadId
    }));
  }, []);

  // Establecer tÃ©rmino de bÃºsqueda
  const setSearchTerm = useCallback((term: string) => {
    setState((prev) => ({
      ...prev,
      searchTerm: term
    }));
  }, []);

  // Establecer filtro
  const setFilter = useCallback((filter: TipificationFilter) => {
    setState((prev) => ({
      ...prev,
      selectedFilter: filter
    }));
  }, []);

  // Limpiar filtro
  const clearFilter = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedFilter: {}
    }));
  }, []);

  // Tipificar un lead
  const tipifyLead = useCallback((leadId: string, blockId: string, optionId: string) => {
    setState((prev) => ({
      ...prev,
      leads: prev.leads.map((lead) => {
        if (lead.id.toString() === leadId) {
          return {
            ...lead,
            tipificationStatus: 'tipified' as const,
            tipificationLabel: `${blockId} â†’ ${optionId}`
          };
        }
        return lead;
      })
    }));
  }, []);

  // Leads pendientes (nunca tipificados)
  const pendingLeads = useMemo(
    () => state.leads.filter((lead) => lead.tipificationStatus !== 'tipified'),
    [state.leads]
  );

  // Leads en gestiÃ³n (fueron seleccionados pero no tipificados)
  const inProgressLeads = useMemo(() => {
    return state.leads.filter(
      (lead) => lead.tipificationStatus === 'pending' && lead.id.toString() === state.selectedLeadId
    );
  }, [state.leads, state.selectedLeadId]);

  // Leads completados (tipificados)
  const completedLeads = useMemo(
    () => state.leads.filter((lead) => lead.tipificationStatus === 'tipified'),
    [state.leads]
  );

  // Aplicar bÃºsqueda
  const searchedLeads = useMemo(() => {
    if (!state.searchTerm) return state.leads;

    const term = state.searchTerm.toLowerCase();
    return state.leads.filter(
      (lead) =>
        (lead.firstName ?? '').toLowerCase().includes(term) ||
        (lead.lastName ?? '').toLowerCase().includes(term) ||
        (lead.phone ?? '').toLowerCase().includes(term)
    );
  }, [state.leads, state.searchTerm]);

  // Aplicar filtro
  const filteredLeads = useMemo(() => {
    let filtered = searchedLeads;

    if (state.selectedFilter.status) {
      // Filtrar por status del bloque (success, pending, rejected, no-contact)
      // Esto seria mÃ¡s complejo en producciÃ³n con datos reales
    }

    if (state.selectedFilter.includeUntipified === false) {
      filtered = filtered.filter((lead) => lead.tipificationStatus === 'tipified');
    }

    return filtered;
  }, [searchedLeads, state.selectedFilter]);

  // Lead seleccionado
  const selectedLead = useMemo(
    () => state.leads.find((lead) => lead.id.toString() === state.selectedLeadId) || null,
    [state.leads, state.selectedLeadId]
  );

  // Obtener siguiente lead sin tipificar
  const getNextLead = useCallback((): BackofficeLead | null => {
    return pendingLeads[0] || null;
  }, [pendingLeads]);

  // EstadÃ­sticas
  const stats = useMemo(
    () => ({
      pending: pendingLeads.length,
      inProgress: inProgressLeads.length,
      completed: completedLeads.length
    }),
    [pendingLeads, inProgressLeads, completedLeads]
  );

  return {
    ...state,
    selectedLead,
    pendingLeads,
    inProgressLeads,
    completedLeads,
    filteredLeads,
    stats,
    selectLead,
    setSearchTerm,
    setFilter,
    clearFilter,
    tipifyLead,
    getNextLead
  };
};

export default useBackofficeLeads;

