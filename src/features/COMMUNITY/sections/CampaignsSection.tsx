import React, { useMemo } from 'react';
import { DataTable } from '@molecules/DataTable';
import type { DataTableColumn } from '@molecules/DataTable';
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

  // Define table columns with calculated metrics
  const campaignTableColumns: DataTableColumn<Campaign>[] = [
    { 
      header: 'CAMPAÑA', 
      accessor: (c) => <span className="table-cell emphasis">{c.campaignName}</span> 
    },
    { 
      header: 'RESULTADOS', 
      accessor: (c) => c.metaAdsLeads ?? 0, 
      headerClassName: 'table-header-cell center', 
      cellClassName: 'table-cell center' 
    },
    { 
      header: 'ALCANCE', 
      accessor: (c) => (c.reach ?? 0).toLocaleString(), 
      headerClassName: 'table-header-cell center', 
      cellClassName: 'table-cell center' 
    },
    { 
      header: 'FRECUENCIA', 
      accessor: (c) => (c.frequency ?? 0).toFixed(2), 
      headerClassName: 'table-header-cell center', 
      cellClassName: 'table-cell center' 
    },
    { 
      header: 'COSTO/RESULTADO', 
      accessor: (c) => metricsMap.get(c.id)?.costPerResult ?? 'S/ 0.00', 
      headerClassName: 'table-header-cell center', 
      cellClassName: 'table-cell center' 
    },
    { 
      header: 'IM.GASTADO', 
      accessor: (c) => `S/ ${(c.totalSpent || 0).toLocaleString()}`, 
      headerClassName: 'table-header-cell center', 
      cellClassName: 'table-cell center' 
    },
    { 
      header: 'IMPRESIONES', 
      accessor: (c) => (c.impressions ?? 0).toLocaleString(), 
      headerClassName: 'table-header-cell center', 
      cellClassName: 'table-cell center' 
    },
    { 
      header: 'CPM', 
      accessor: (c) => metricsMap.get(c.id)?.cpm ?? 'S/ 0.00', 
      headerClassName: 'table-header-cell center', 
      cellClassName: 'table-cell center' 
    },
    { 
      header: 'CLICS ENLACE', 
      accessor: (c) => (c.clicks ?? 0).toLocaleString(), 
      headerClassName: 'table-header-cell center', 
      cellClassName: 'table-cell center' 
    },
    { 
      header: 'CPC', 
      accessor: (c) => metricsMap.get(c.id)?.cpc ?? 'S/ 0.00', 
      headerClassName: 'table-header-cell center', 
      cellClassName: 'table-cell center' 
    },
    { 
      header: 'CTR', 
      accessor: (c) => metricsMap.get(c.id)?.ctr ?? '0.00%', 
      headerClassName: 'table-header-cell center', 
      cellClassName: 'table-cell center' 
    },
    { 
      header: 'CLICS [TODOS]', 
      accessor: (c) => (c.clicsTotal ?? 0).toLocaleString(), 
      headerClassName: 'table-header-cell center', 
      cellClassName: 'table-cell center' 
    },
    { 
      header: 'VENTAS C.', 
      accessor: (c) => c.ventasCerradas ?? 0, 
      headerClassName: 'table-header-cell center highlight-header', 
      cellClassName: 'table-cell center highlight' 
    },
    { 
      header: 'CONTACTO', 
      accessor: (c) => c.contacto ?? 0, 
      headerClassName: 'table-header-cell center highlight-header', 
      cellClassName: 'table-cell center highlight' 
    },
  ];

  return (
    <div className="campaigns-container">
      <h2 className="campaigns-title">CAMPAÑAS META ADS</h2>
      <DataTable
        columns={campaignTableColumns}
        data={state.campaigns}
        rowClassName="clickable-row"
      />
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
