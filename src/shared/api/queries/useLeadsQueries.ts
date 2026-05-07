/**
 * React Query Hooks for Leads Module
 * 
 * Gradually replaces manual fetch in useCommunityData hook
 * FSD Layer: shared/api/queries (Query Infrastructure)
 * 
 * Usage:
 *   const { data: campaigns } = useLeadsListQuery('campaigns');
 *   const { mutate: createPlan } = useLeadsMutationQuery('plan', 'create');
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LeadsRepository } from '../repositories/leads.repository';
import type {
  CampanaResponse,
  CampanaRequest,
  CuentaPublicitariaResponse,
  CuentaPublicitariaRequest,
  EventoResponse,
  PlanResponse,
  PlanRequest,
  PlanUpdateRequest,
  ProveedorResponse,
  ProveedorRequest,
  ZonaResponse,
  ZonaRequest,
} from '@shared/types';

/**
 * Query Keys for cache invalidation
 */
export const leadsQueryKeys = {
  all: () => ['leads'] as const,
  campaigns: () => [...leadsQueryKeys.all(), 'campaigns'] as const,
  campaignById: (id: number) => [...leadsQueryKeys.campaigns(), id] as const,
  accounts: () => [...leadsQueryKeys.all(), 'accounts'] as const,
  accountById: (id: number) => [...leadsQueryKeys.accounts(), id] as const,
  plans: () => [...leadsQueryKeys.all(), 'plans'] as const,
  planById: (id: number) => [...leadsQueryKeys.plans(), id] as const,
  promotions: () => [...leadsQueryKeys.all(), 'promotions'] as const,
  promotionById: (id: number) => [...leadsQueryKeys.promotions(), id] as const,
  providers: () => [...leadsQueryKeys.all(), 'providers'] as const,
  providerById: (id: number) => [...leadsQueryKeys.providers(), id] as const,
  zones: () => [...leadsQueryKeys.all(), 'zones'] as const,
  zoneById: (id: number) => [...leadsQueryKeys.zones(), id] as const,
};

/**
 * ─── CAMPAIGNS QUERIES ───────────────────────────────────────────────────────
 */

export function useLeadsCampaignsQuery(activo?: boolean) {
  return useQuery({
    queryKey: leadsQueryKeys.campaigns(),
    queryFn: () => LeadsRepository.getCampanas(activo),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useLeadsCampaignCreateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CampanaRequest) => LeadsRepository.createCampana(payload),
    onSuccess: (newCampaign) => {
      // Update cache with new campaign
      queryClient.setQueryData(leadsQueryKeys.campaigns(), (old: CampanaResponse[] | undefined) => [
        ...(old || []),
        newCampaign,
      ]);
    },
  });
}

export function useLeadsCampaignUpdateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CampanaRequest }) =>
      LeadsRepository.updateCampana(id, payload),
    onSuccess: (updated) => {
      // Update specific campaign in cache
      queryClient.setQueryData(leadsQueryKeys.campaignById(updated.id), updated);
      // Update list cache
      queryClient.setQueryData(leadsQueryKeys.campaigns(), (old: CampanaResponse[] | undefined) =>
        old ? old.map((c) => (c.id === updated.id ? updated : c)) : undefined
      );
    },
  });
}

export function useLeadsCampaignDeleteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => LeadsRepository.deleteCampana(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.setQueryData(leadsQueryKeys.campaigns(), (old: CampanaResponse[] | undefined) =>
        old ? old.filter((c) => c.id !== deletedId) : undefined
      );
    },
  });
}

/**
 * ─── ACCOUNTS (CUENTAS PUBLICITARIAS) QUERIES ───────────────────────────────
 */

export function useLeadsAccountsQuery(activo?: boolean) {
  return useQuery({
    queryKey: leadsQueryKeys.accounts(),
    queryFn: () => LeadsRepository.getCuentasPublicitarias(activo),
    staleTime: 1000 * 60 * 5,
  });
}

export function useLeadsAccountCreateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CuentaPublicitariaRequest) => LeadsRepository.createCuentaPublicitaria(payload),
    onSuccess: (newAccount) => {
      queryClient.setQueryData(
        leadsQueryKeys.accounts(),
        (old: CuentaPublicitariaResponse[] | undefined) => [...(old || []), newAccount]
      );
    },
  });
}

export function useLeadsAccountDeleteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => LeadsRepository.deleteCuentaPublicitaria(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(leadsQueryKeys.accounts(), (old: CuentaPublicitariaResponse[] | undefined) =>
        old ? old.filter((a) => a.id !== deletedId) : undefined
      );
    },
  });
}

/**
 * ─── PLANS QUERIES ──────────────────────────────────────────────────────────
 */

export function useLeadsPlansQuery() {
  return useQuery({
    queryKey: leadsQueryKeys.plans(),
    queryFn: () => LeadsRepository.getPlanes(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useLeadsPlanCreateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PlanRequest) => LeadsRepository.createPlan(payload),
    onSuccess: (newPlan) => {
      queryClient.setQueryData(leadsQueryKeys.plans(), (old: PlanResponse[] | undefined) => [
        ...(old || []),
        newPlan,
      ]);
    },
  });
}

export function useLeadsPlanUpdateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: PlanUpdateRequest }) =>
      LeadsRepository.updatePlan(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(leadsQueryKeys.planById(updated.id), updated);
      queryClient.setQueryData(leadsQueryKeys.plans(), (old: PlanResponse[] | undefined) =>
        old ? old.map((p) => (p.id === updated.id ? updated : p)) : undefined
      );
    },
  });
}

export function useLeadsPlanDeleteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => LeadsRepository.deletePlan(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(leadsQueryKeys.plans(), (old: PlanResponse[] | undefined) =>
        old ? old.filter((p) => p.id !== deletedId) : undefined
      );
    },
  });
}

/**
 * ─── PROMOTIONS QUERIES ─────────────────────────────────────────────────────
 */

export function useLeadsPromotionsQuery() {
  return useQuery({
    queryKey: leadsQueryKeys.promotions(),
    queryFn: () => LeadsRepository.getPromociones(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useLeadsPromotionCreateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: any) => LeadsRepository.createPromocion(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsQueryKeys.promotions() });
    },
  });
}

export function useLeadsPromotionDeleteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => LeadsRepository.deletePromocion(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: leadsQueryKeys.promotions() });
    },
  });
}

/**
 * ─── PROVIDERS QUERIES ──────────────────────────────────────────────────────
 */

export function useLeadsProvidersQuery() {
  return useQuery({
    queryKey: leadsQueryKeys.providers(),
    queryFn: () => LeadsRepository.getProveedores(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useLeadsProviderCreateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProveedorRequest) => LeadsRepository.createProveedor(payload),
    onSuccess: (newProvider) => {
      queryClient.setQueryData(leadsQueryKeys.providers(), (old: ProveedorResponse[] | undefined) => [
        ...(old || []),
        newProvider,
      ]);
    },
  });
}

/**
 * ─── ZONES QUERIES ──────────────────────────────────────────────────────────
 */

export function useLeadsZonesQuery() {
  return useQuery({
    queryKey: leadsQueryKeys.zones(),
    queryFn: () => LeadsRepository.getZonas(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useLeadsZoneCreateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ZonaRequest) => LeadsRepository.createZona(payload),
    onSuccess: (newZone) => {
      queryClient.setQueryData(leadsQueryKeys.zones(), (old: ZonaResponse[] | undefined) => [
        ...(old || []),
        newZone,
      ]);
    },
  });
}

export function useLeadsZoneUpdateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ZonaRequest }) =>
      LeadsRepository.updateZona(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(leadsQueryKeys.zoneById(updated.id), updated);
      queryClient.setQueryData(leadsQueryKeys.zones(), (old: ZonaResponse[] | undefined) =>
        old ? old.map((z) => (z.id === updated.id ? updated : z)) : undefined
      );
    },
  });
}

export function useLeadsZoneDeleteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => {
      // Zone deletion - invalidate cache
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsQueryKeys.zones() });
    },
  });
}

/**
 * ─── CONVENIENCE HOOK: Load All Leads Data at Once ──────────────────────────
 * Used when multiple entities need to be loaded together
 */

export function useAllLeadsData() {
  const campaigns = useLeadsCampaignsQuery();
  const accounts = useLeadsAccountsQuery();
  const plans = useLeadsPlansQuery();
  const promotions = useLeadsPromotionsQuery();
  const providers = useLeadsProvidersQuery();
  const zones = useLeadsZonesQuery();

  const isLoading = [campaigns, accounts, plans, promotions, providers, zones].some((q) => q.isLoading);
  const isError = [campaigns, accounts, plans, promotions, providers, zones].some((q) => q.isError);

  return {
    campaigns: campaigns.data ?? [],
    accounts: accounts.data ?? [],
    plans: plans.data ?? [],
    promotions: promotions.data ?? [],
    providers: providers.data ?? [],
    zones: zones.data ?? [],
    isLoading,
    isError,
  };
}
