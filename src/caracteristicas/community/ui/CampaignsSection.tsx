import React, { useMemo } from 'react';
// DEPRECATED: DataTable fue eliminado en migración FSD (Bloque 5)
// import { DataTable } from '@molecules/DataTable';
// import type { DataTableColumn } from '@molecules/DataTable';
import type { Campaign, CommunityDashboardState } from '../hooks/useCommunityDashboard';

/**
 * CampaignsSection Component
 * 
 * Renders the campaigns table with detailed metrics
 * - Display campaigns with META ADS metrics
 * - Uses pre-calculated metrics (CPM, CPC, CTR, ROAS) from hook
 * - Highlight columns: Ventas Cerradas, Contacto
 * 
 * Problema #6: Memoized to prevent re-renders when parent updates
 * but campaigns/metrics haven't changed
 * 
 * Part of CommunityDashboard refactorization (Problem #2 & #4)
 */
interface CampaignsSectionProps {
  state: CommunityDashboardState;
}

const CampaignsSectionComponent: React.FC<CampaignsSectionProps> = ({ state }) => {
  /**
   * Create a map of campaign metrics by ID for O(1) lookup
   * Much more efficient than searching array each time render
   * Depende de: campaignMetrics
   */
  const metricsMap = useMemo(() => {
    const map = new Map();
    state.campaignMetrics.forEach(metric => {
      map.set(metric.campaignId, metric);
    });
    return map;
  }, [state.campaignMetrics]);

  // DEPRECATED: DataTable fue eliminado en migración FSD (Bloque 5)
  // La lógica de tabla de campañas necesita ser reescrita usando una librería moderna
  // (tanstack-table, recharts, o componente custom)
  /*
  const campaignTableColumns: DataTableColumn<Campaign>[] = [
    { 
      header: 'CAMPAÑA', 
      accessor: (c) => <span className="table-cell emphasis">{c.campaignName}</span> 
    },
    // ... más columnas (comentadas)
  ];
  */

  return (
    <div className="campaigns-container">
      <h2 className="campaigns-title">CAMPAÑAS META ADS</h2>
      <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '4px', marginTop: '10px' }}>
        <p style={{ color: '#666', margin: 0 }}>
          ⚠️ Tabla de Campañas en mantenimiento - DataTable fue eliminado en migración FSD (Bloque 5)
        </p>
        <p style={{ color: '#999', fontSize: '12px', margin: '5px 0 0 0' }}>
          {state.campaigns?.length ?? 0} campañas disponibles
        </p>
      </div>
      {/* DEPRECATED DataTable component
      <DataTable
        columns={campaignTableColumns}
        data={state.campaigns}
        rowClassName="clickable-row"
      />
      */}
    </div>
  );
};

/**
 * Problema #6: Component Memoization
 * 
 * Wrapped with React.memo to prevent unnecessary re-renders
 * when parent components update but campaigns/metrics aren't affected
 */
export const CampaignsSection = React.memo(CampaignsSectionComponent);
