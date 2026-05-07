/**
 * React Query Hooks for Applicants Module
 * 
 * Replaces useApplicantsSync hook with React Query
 * FSD Layer: shared/api/queries
 */

import { useQuery } from '@tanstack/react-query';
import { ApplicantRepository } from '@shared/api';
import type { PostulanteResponse } from '@shared/types';

export const applicantsQueryKeys = {
  all: () => ['applicants'] as const,
  byStage: (stage: string) => [...applicantsQueryKeys.all(), 'stage', stage] as const,
  recruitment: () => [...applicantsQueryKeys.all(), 'recruitment'] as const,
  training: () => [...applicantsQueryKeys.all(), 'training'] as const,
  detail: (id: number) => [...applicantsQueryKeys.all(), 'detail', id] as const,
};

/**
 * Fetch applicants by stage (replaces useApplicantsSync)
 */
export function useApplicantsByStageQuery(etapa?: string) {
  return useQuery({
    queryKey: applicantsQueryKeys.byStage(etapa || ''),
    queryFn: async () => {
      if (etapa === 'RECLUTAMIENTO') {
        return ApplicantRepository.getReclutamiento();
      } else if (etapa === 'CAPACITACION') {
        return ApplicantRepository.getCapacitacion();
      } else if (etapa) {
        return ApplicantRepository.getByEtapa(etapa as any);
      }
      return [];
    },
    enabled: !!etapa,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch recruitment applicants
 */
export function useApplicantsRecruitmentQuery() {
  return useQuery({
    queryKey: applicantsQueryKeys.recruitment(),
    queryFn: () => ApplicantRepository.getReclutamiento(),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch training applicants
 */
export function useApplicantsTrainingQuery() {
  return useQuery({
    queryKey: applicantsQueryKeys.training(),
    queryFn: () => ApplicantRepository.getCapacitacion(),
    staleTime: 1000 * 60 * 5,
  });
}
