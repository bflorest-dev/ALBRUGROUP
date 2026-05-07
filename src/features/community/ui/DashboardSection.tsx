import React from 'react';
import { BiPlus } from 'react-icons/bi';
import { LeadsManagementSection } from './LeadsManagementSection';
import { CampaignsSection } from './CampaignsSection';
import type { CommunityDashboardState } from '@shared/types/community';

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
          <h1>GestiÃ³n de Community Manager</h1>
          <p>Meta Ads + Seguimiento de Leads</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-new-campaign" 
            onClick={state.handleToggleModalOpen}
          >
            <BiPlus size={18} />
            Nueva CampaÃ±a
          </button>
        </div>
      </div>

      {/* Two-Column Layout: Metrics (Left) + Leads (Right) */}
      <div className="community-dashboard-content">
        {/* DEPRECATED: MetricsSection fue eliminado */}
        {/* <MetricsSection state={state} /> */}
        <LeadsManagementSection state={state} />
      </div>

      {/* Campaigns Table (Full Width) */}
      <CampaignsSection state={state} />
    </>
  );
};


export const DashboardSection = React.memo(DashboardSectionComponent);

