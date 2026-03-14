import React, { Suspense } from 'react';
import { BiPlus } from 'react-icons/bi';
import { HeaderActions } from '@molecules/HeaderActions';
import { MetricsSectionLazy, LeadsManagementSectionLazy, CampaignsSectionLazy, LoadingFallback } from '../utils/lazyLoadSections';
import type { CommunityDashboardState } from '../hooks/useCommunityDashboard';

/**
 * DashboardSection Component
 * 
 * Main dashboard section containing:
 * - Header with title and "New Campaign" button
 * - Two-column layout: MetricsSection (left) + LeadsManagementSection (right)
 * - CampaignsSection (full width table)
 * 
 * Orchestrates sub-components and handles section rendering
 * 
 * Part of CommunityDashboard refactorization (Problem #2)
 */
interface DashboardSectionProps {
  state: CommunityDashboardState;
}

/**
 * Problema #6: Component Memoization
 * Wrapped with React.memo to prevent unnecessary re-renders
 * when parent updates but dashboard state hasn't changed
 */
const DashboardSectionComponent: React.FC<DashboardSectionProps> = ({ state }) => {
  return (
    <>
      {/* Header */}
      <div className="community-dashboard-header">
        <div className="community-header-title">
          <h1>Gestión de Community Manager</h1>
          <p>Meta Ads + Seguimiento de Leads</p>
        </div>
        <HeaderActions>
          <button 
            className="btn-new-campaign" 
            onClick={state.handleToggleModalOpen}
          >
            <BiPlus size={18} />
            Nueva Campaña
          </button>
        </HeaderActions>
      </div>

      {/* Two-Column Layout: Metrics (Left) + Leads (Right) */}
      <div className="community-dashboard-content">
        <Suspense fallback={<LoadingFallback />}>
          <MetricsSectionLazy state={state} />
        </Suspense>
        <Suspense fallback={<LoadingFallback />}>
          <LeadsManagementSectionLazy state={state} />
        </Suspense>
      </div>

      {/* Campaigns Table (Full Width) */}
      <Suspense fallback={<LoadingFallback />}>
        <CampaignsSectionLazy state={state} />
      </Suspense>
    </>
  );
};


export const DashboardSection = React.memo(DashboardSectionComponent);
