import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LeadsRepository } from '@shared/api';
import { AsesorVentasRepository } from '../model/asesor-ventas.repo';
import type { UpdatePreventaPayload, TipificarLeadPayload } from '@shared/types';

export const useBandejaLeads = () => {
  return useQuery({
    queryKey: ['bandeja-leads-asesor'],
    queryFn: () => AsesorVentasRepository.getBandejaLeads(),
  });
};

export const useDetalleLead = (idLead: number | null) => {
  return useQuery({
    queryKey: ['detalle-lead-asesor', idLead],
    queryFn: () => LeadsRepository.getDetalleAsesor(idLead!),
    enabled: !!idLead,
  });
};

export const usePlanes = () => {
  return useQuery({
    queryKey: ['planes'],
    queryFn: () => LeadsRepository.getPlanes(),
  });
};

export const useCatalogoTipificacion = (etapa: string) => {
  return useQuery({
    queryKey: ['catalogo-tipificacion', etapa],
    queryFn: () => LeadsRepository.getCatalogoTipificacion(etapa),
  });
};

export const useUpdatePreventaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idLead, payload }: { idLead: number; payload: UpdatePreventaPayload }) =>
      LeadsRepository.updateDatosPreventa(idLead, payload),
    onSuccess: (_, { idLead }) => {
      queryClient.invalidateQueries({ queryKey: ['detalle-lead-asesor', idLead] });
      queryClient.invalidateQueries({ queryKey: ['bandeja-leads-asesor'] });
    },
  });
};

export const useTipificarLeadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idLead, payload }: { idLead: number; payload: TipificarLeadPayload }) =>
      LeadsRepository.tipificarLead(idLead, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bandeja-leads-asesor'] });
    },
  });
};

export const useRegistrarContactoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idLead, payload }: { idLead: number; payload: { fecha?: string; hora?: string } }) =>
      LeadsRepository.registrarContacto(idLead, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['detalle-lead-asesor'] });
      queryClient.invalidateQueries({ queryKey: ['bandeja-leads-asesor'] });
    },
  });
};

export const useActualizarOfertaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idLead, payload }: { idLead: number; payload: { idPlan: number; idPromocion?: number; planUsb?: boolean; planTv?: boolean; planWifi?: boolean } }) =>
      LeadsRepository.updateOfertaComercial(idLead, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['detalle-lead-asesor'] });
      queryClient.invalidateQueries({ queryKey: ['bandeja-leads-asesor'] });
    },
  });
};

export const useActualizarDireccionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idLead, payload }: { idLead: number; payload: { tipoVia?: string; via?: string; direccion?: string; numero?: string; referencia?: string; latitud?: number; longitud?: number; tipoDomicilio?: string; urbanizacion?: string; manzana?: string; lote?: string; plano?: string; piso?: string; interior?: string } }) =>
      LeadsRepository.updateDireccion(idLead, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['detalle-lead-asesor'] });
      queryClient.invalidateQueries({ queryKey: ['bandeja-leads-asesor'] });
    },
  });
};

export const useActualizarDatosPreventaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idLead, payload }: { idLead: number; payload: UpdatePreventaPayload }) =>
      LeadsRepository.updateDatosPreventa(idLead, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['detalle-lead-asesor'] });
      queryClient.invalidateQueries({ queryKey: ['bandeja-leads-asesor'] });
    },
  });
};
