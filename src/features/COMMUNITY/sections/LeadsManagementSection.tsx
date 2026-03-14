import React from 'react';
import type { CommunityDashboardState } from '../hooks/useCommunityDashboard';

/**
 * LeadsManagementSection Component
 * 
 * Renders a table with leads grouped by campaign and date
 * - Shows total leads and converted leads per campaign
 * - Expandable rows to show leads by date
 * 
 * Part of CommunityDashboard refactorization (Problem #2)
 */
interface LeadsManagementSectionProps {
  state: CommunityDashboardState;
}

/**
 * Problema #6: Component Memoization
 * Wrapped with React.memo to prevent unnecessary re-renders
 * when parent updates but leads haven't changed
 */
const LeadsManagementSectionComponent: React.FC<LeadsManagementSectionProps> = ({ state }) => {
  return (
    <div className="community-right-panel">
      <div className="card">
        <h3 className="card-heading">GESTIÓN DE LEADS</h3>
        <div className="table-wrapper">
          <table className="table-custom">
            <thead>
              <tr className="table-header-row">
                <th className="table-header-cell">CAMPAÑA</th>
                <th className="table-header-cell center">LEADS</th>
                <th className="table-header-cell center">CONV.</th>
              </tr>
            </thead>
            <tbody>
              {state.campaignLeadsBreakdown.map(({ campaign, totalLeads, convertedLeads, leadsByDate }) => (
                <React.Fragment key={campaign.id}>
                  {/* Campaign Row */}
                  <tr 
                    onClick={() => state.handleToggleExpandCampaign(campaign.id)}
                    className={`table-row ${state.expandedCampaignId === campaign.id ? 'expanded' : ''}`}
                  >
                    <td className="table-cell emphasis">{campaign.campaignName}</td>
                    <td className="table-cell center">{totalLeads}</td>
                    <td className="table-cell center converted">{convertedLeads}</td>
                  </tr>

                  {/* Expanded Row: Leads by Date */}
                  {state.expandedCampaignId === campaign.id && 
                    Object.entries(leadsByDate).map(([date, dateLeads]) => (
                      <tr key={`${campaign.id}-${date}`} className="table-row subrow">
                        <td colSpan={3} className="table-cell">
                          <div className="subrow-info">
                            <strong>{date}</strong>: {dateLeads.length} leads {dateLeads.filter(l => l.status === 'convertido').length > 0 && `(${dateLeads.filter(l => l.status === 'convertido').length} convertidos)`}
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


export const LeadsManagementSection = React.memo(LeadsManagementSectionComponent);
