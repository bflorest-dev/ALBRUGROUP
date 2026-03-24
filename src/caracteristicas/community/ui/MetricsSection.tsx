import React from 'react';
import { MetricsPanel } from '@molecules/index';
// DEPRECATED: useCommunityDashboard hook no existe en esta feature
// import type { CommunityDashboardState } from '../hooks/useCommunityDashboard';
type CommunityDashboardState = unknown; // Placeholder

/**
 * MetricsSection Component
 * 
 * Renders the two metrics panels: META ADS and DRIVE
 * - Displays summarized metrics from all campaigns
 * - Clickable panels to open edit modal
 * 
 * Part of CommunityDashboard refactorization (Problem #2)
 */
interface MetricsSectionProps {
  state: CommunityDashboardState;
}

/**
 * Problema #6: Component Memoization
 * Wrapped with React.memo to prevent unnecessary re-renders
 * when parent updates but metrics haven't changed
 */
const MetricsSectionComponent: React.FC<MetricsSectionProps> = ({ state }) => {
  return (
    <div className="community-left-panel">
      {/* META ADS Metrics Panel */}
      <div 
        className="clickable" 
        onClick={() => state.handleToggleEditMetricsOpen('META ADS')}
      >
        <MetricsPanel 
          title="META ADS" 
          metrics={state.metaAdsMetrics}
          color="#3B82F6"
        />
      </div>

      {/* DRIVE Metrics Panel */}
      <div 
        className="clickable" 
        onClick={() => state.handleToggleEditMetricsOpen('DRIVE')}
      >
        <MetricsPanel 
          title="DRIVE" 
          metrics={state.driveMetrics}
          color="#F59E0B"
        />
      </div>
    </div>
  );
};


export const MetricsSection = React.memo(MetricsSectionComponent);
