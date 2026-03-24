import { Suspense } from 'react';
import type { ErrorInfo } from 'react';
import { CommunityMenubar } from '../components/CommunityMenubar';
import { AdvertiserAccountsSection } from '../components/AdvertiserAccountsSection';
import { CompaniesSection } from '../components/CompaniesSection';
import { CampaignsKanban } from '../components/CampaignsKanban';
import { useCommunityDashboard } from '../hooks/useCommunityDashboard';
import { DashboardSection } from '@caracteristicas/community/ui/DashboardSection';
import { ModalsSectionLazy } from '@compartido/lib/lazyLoad';
import { FeatureErrorBoundary } from '@compartido/ui/limitadorErrores/FeatureErrorBoundary';
import { ErrorLogger } from '@compartido/lib';
import './CommunityDashboard.css';


/**
 * CommunityDashboard Page Component
 * 
 * Refactored: Problem #2 - CommunityDashboard Refactorization
 * 
 * Simplified component that orchestrates different sections:
 * - Main dashboard with metrics, leads, and campaigns
 * - Advertiser accounts management
 * - Companies management
 * - Campaigns Kanban view
 * 
 * All logic moved to useCommunityDashboard() hook
 * All rendering delegated to section components
 * 
 * P11: Wrapped in FeatureErrorBoundary for granular error handling
 * 
 * BEFORE: 800 lines (monolithic)
 * AFTER: 50 lines (composition pattern) + error boundary
 */
const CommunityDashboardContent = () => {
  const state = useCommunityDashboard();

  return (
    <div className="community-dashboard-wrapper">
      {/* Vertical Menubar for Section Navigation */}
      <CommunityMenubar 
        activeSection={state.activeSection} 
        onSectionChange={state.setActiveSection} 
      />

      {/* Main Content */}
      <div className="community-dashboard">
        {/* SECTION: Advertiser Accounts */}
        {state.activeSection === 'accounts' && (
          <div className="community-section-content">
            <AdvertiserAccountsSection 
              accounts={state.advertiserAccounts}
              onAccountsChange={state.setAdvertiserAccounts}
            />
          </div>
        )}

        {/* SECTION: Companies */}
        {state.activeSection === 'companies' && (
          <div className="community-section-content">
            <CompaniesSection 
              companies={state.companies}
              onCompaniesChange={state.setCompanies}
            />
          </div>
        )}

        {/* SECTION: Campaigns Kanban */}
        {state.activeSection === 'campaigns' && (
          <div className="community-section-content">
            <CampaignsKanban 
              companies={state.companies}
              advertiserAccounts={state.advertiserAccounts}
            />
          </div>
        )}

        {/* SECTION: Main Dashboard */}
        {state.activeSection === 'dashboard' && (
          <DashboardSection state={state} />
        )}
      </div>

      {/* All Modals */}
      <Suspense fallback={null}>
        <ModalsSectionLazy state={state} />
      </Suspense>
    </div>
  );
};

export const CommunityDashboard = () => {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    ErrorLogger.logError('CommunityDashboard', error, {
      componentStack: errorInfo.componentStack,
      feature: 'COMMUNITY'
    });
  };

  return (
    <FeatureErrorBoundary 
      featureName="COMMUNITY"
      onError={handleError}
    >
      <CommunityDashboardContent />
    </FeatureErrorBoundary>
  );
};
