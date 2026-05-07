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
} from '@entities/lead/types';
import { LeadsRepository } from '@shared/api/repositories/leads.repository';

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
    queryFn: () => LeadsRepository.getBandejaGtr(filtros),
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
    queryFn: () => LeadsRepository.getBandejaAsesor(),
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
    queryFn: () => LeadsRepository.getDetalleAsesor(idLead!),
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
    mutationFn: (data: LeadIntakeRequest) => LeadsRepository.intakeLead(data),
    onSuccess: () => {
      // Invalidar caches relevantes usando prefix matching
      // exact: false permite que invalide todas las queries que comiencen con estas keys
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadsGTR(), exact: false });
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadsAsesor(), exact: false });
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
      LeadsRepository.asignarLead(idLead, data),
    onSuccess: (_, { idLead }) => {
      // Invalidar caches usando exact: false para que coincida con queryKeys que tengan filtros adicionales
      queryClient.invalidateQueries({ 
        queryKey: gtrQueryKeys.leadsGTR(), 
        exact: false 
      });
      queryClient.invalidateQueries({ 
        queryKey: gtrQueryKeys.leadsAsesor(), 
        exact: false 
      });
      queryClient.invalidateQueries({ 
        queryKey: gtrQueryKeys.leadDetalle(idLead),
        exact: false
      });
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
      LeadsRepository.updateDatosPreventa(idLead, data),
    onSuccess: (_, { idLead }) => {
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadsGTR(), exact: false });
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadsAsesor(), exact: false });
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadDetalle(idLead), exact: false });
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
      LeadsRepository.updateDireccion(idLead, data),
    onSuccess: (_, { idLead }) => {
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadsGTR(), exact: false });
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadsAsesor(), exact: false });
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadDetalle(idLead), exact: false });
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
      LeadsRepository.tipificarLead(idLead, data),
    onSuccess: (_, { idLead }) => {
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadsGTR(), exact: false });
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadsAsesor(), exact: false });
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadDetalle(idLead), exact: false });
    },
  });
}

/**
 * useContactLeadMutation - Registrar contacto con lead
 */
export function useContactLeadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (idLead: number) => LeadsRepository.registrarContacto(idLead),
    onSuccess: (_, idLead) => {
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadsGTR(), exact: false });
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadsAsesor(), exact: false });
      queryClient.invalidateQueries({ queryKey: gtrQueryKeys.leadDetalle(idLead), exact: false });
    },
  });
}
