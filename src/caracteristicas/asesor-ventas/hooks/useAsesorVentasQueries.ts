import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AsesorVentasRepository } from '../model';
import type {
  LeadAsesorVentasResponse,
  ContactoRequest,
  TipificacionRequest,
  OfertaComercialRequest,
  DireccionRequest,
  DatosPreventa,
} from '../model';

/**
 * Query keys para ASESOR_VENTAS
 */
const ASESOR_VENTAS_KEYS = {
  all: ['asesor-ventas'] as const,
  bandeja: () => [...ASESOR_VENTAS_KEYS.all, 'bandeja'] as const,
};

/**
 * Hook: Obtener bandeja de leads asignados
 */
export const useBandejaLeads = () => {
  return useQuery({
    queryKey: ASESOR_VENTAS_KEYS.bandeja(),
    queryFn: () => AsesorVentasRepository.getBandejaLeads(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook: Registrar contacto con cliente
 */
export const useRegistrarContactoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idLead, payload }: { idLead: number; payload: ContactoRequest }) =>
      AsesorVentasRepository.registrarContacto(idLead, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASESOR_VENTAS_KEYS.bandeja() });
    },
  });
};

/**
 * Hook: Tipificar lead
 */
export const useTipificarLeadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idLead, payload }: { idLead: number; payload: TipificacionRequest }) =>
      AsesorVentasRepository.tipificarLead(idLead, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASESOR_VENTAS_KEYS.bandeja() });
    },
  });
};

/**
 * Hook: Actualizar oferta comercial
 */
export const useActualizarOfertaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idLead, payload }: { idLead: number; payload: OfertaComercialRequest }) =>
      AsesorVentasRepository.actualizarOfertaComercial(idLead, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASESOR_VENTAS_KEYS.bandeja() });
    },
  });
};

/**
 * Hook: Actualizar dirección
 */
export const useActualizarDireccionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idLead, payload }: { idLead: number; payload: DireccionRequest }) =>
      AsesorVentasRepository.actualizarDireccion(idLead, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASESOR_VENTAS_KEYS.bandeja() });
    },
  });
};

/**
 * Hook: Actualizar datos preventa
 */
export const useActualizarDatosPreventaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idLead, payload }: { idLead: number; payload: DatosPreventa }) =>
      AsesorVentasRepository.actualizarDatosPreventa(idLead, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASESOR_VENTAS_KEYS.bandeja() });
    },
  });
};
