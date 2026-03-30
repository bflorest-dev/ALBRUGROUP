/**
 * Hooks para operaciones de GTR (Gestión de Leads)
 * FSD: caracteristicas/gtr/hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  LeadIntakeRequest,
  LeadAsignacionRequest,
  LeadDatosPreventaRequest,
  LeadDireccionRequest,
  LeadOfertaComercialRequest,
  LeadTipificacionRequest,
  LeadAsesorVentasResponse,
  LeadGtrResponse,
} from '@entidades/lead/types';
import { GtrRepository } from '../model/gtr.repo';

/**
 * Query Keys para caché de React Query
 */
export const gtrQueryKeys = {
  all: () => ['gtr'] as const,
  leadsGTR: () => [...gtrQueryKeys.all(), 'leads'] as const,
  leadsGTRByDate: (fecha?: string) => [...gtrQueryKeys.leadsGTR(), { fecha }] as const,
  leadsAsesor: () => [...gtrQueryKeys.all(), 'asesor'] as const,
  leadsAsesorByFilter: (filtros?: object) =>
    [...gtrQueryKeys.leadsAsesor(), filtros] as const,
  leadDetalle: (idLead: number) => [...gtrQueryKeys.all(), 'detalle', idLead] as const,
};

/**
 * useLeadsGTR - Obtener todos los leads para vista GTR
 */
export function useLeadsGTR(filtros?: { fecha?: string }) {
  return useQuery({
    queryKey: gtrQueryKeys.leadsGTRByDate(filtros?.fecha),
    queryFn: () => GtrRepository.getLeadsGTR(filtros),
    staleTime: 1000 * 60 * 5, // 5 min
    gcTime: 1000 * 60 * 10, // 10 min
  });
}

/**
 * useLeadsAsesorVentas - Obtener leads del asesor
 */
export function useLeadsAsesorVentas(filtros?: {
  idAsesor?: number;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}) {
  return useQuery({
    queryKey: gtrQueryKeys.leadsAsesorByFilter(filtros),
    queryFn: () => GtrRepository.getLeadsAsesorVentas(filtros),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * useLeadDetalleAsesor - Obtener detalle de lead
 */
export function useLeadDetalleAsesor(idLead?: number) {
  return useQuery({
    queryKey: idLead ? gtrQueryKeys.leadDetalle(idLead) : [],
    queryFn: () => GtrRepository.getLeadDetalleAsesor(idLead!),
    enabled: !!idLead,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * useCreateLeadMutation - Crear nuevo lead
 */
export function useCreateLeadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LeadIntakeRequest) => GtrRepository.createLead(data),
    onSuccess: () => {
      // Invalidar caches relevantes (incluyendo variante con fecha) para refrescar Tablero
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadsGTR() });
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadsGTRByDate() });
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadsAsesor() });
    },
  });
}

/**
 * useAssignLeadMutation - Asignar lead a asesor
 */
export function useAssignLeadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idLead, data }: { idLead: number; data: LeadAsignacionRequest }) =>
      GtrRepository.assignLead(idLead, data),
    onSuccess: (_, { idLead }) => {
      // Invalidar caches
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadsGTR() });
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadsAsesor() });
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadDetalle(idLead) });
    },
  });
}

/**
 * useUpdateLeadPreventaMutation - Actualizar datos de preventa
 */
export function useUpdateLeadPreventaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idLead, data }: { idLead: number; data: LeadDatosPreventaRequest }) =>
      GtrRepository.updateLeadPreventa(idLead, data),
    onSuccess: (_, { idLead }) => {
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadDetalle(idLead) });
    },
  });
}

/**
 * useUpdateLeadDireccionMutation - Actualizar dirección
 */
export function useUpdateLeadDireccionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idLead, data }: { idLead: number; data: LeadDireccionRequest }) =>
      GtrRepository.updateLeadDireccion(idLead, data),
    onSuccess: (_, { idLead }) => {
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadDetalle(idLead) });
    },
  });
}

/**
 * useTypifyLeadMutation - Tipificar lead
 */
export function useTypifyLeadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idLead, data }: { idLead: number; data: LeadTipificacionRequest }) =>
      GtrRepository.typifyLead(idLead, data),
    onSuccess: (_, { idLead }) => {
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadsGTR() });
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadDetalle(idLead) });
    },
  });
}

/**
 * useContactLeadMutation - Registrar contacto con lead
 */
export function useContactLeadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (idLead: number) => GtrRepository.contactLead(idLead),
    onSuccess: (_, idLead) => {
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadsGTR() });
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadsAsesor() });
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadDetalle(idLead) });
    },
  });
}
