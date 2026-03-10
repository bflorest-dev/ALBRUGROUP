import React from 'react';
import './LeadsWidget.css';

interface Lead {
  id: string;
  name: string;
  status: 'no-contesta' | 'solo-info' | 'interesado' | 'derivado' | 'convertido';
  canal: string;
  fecha: string;
}

interface LeadsWidgetProps {
  leads: Lead[];
}

const statusConfig = {
  'no-contesta': { label: 'No Contesta', color: '#EF4444' },
  'solo-info': { label: 'Solo Información', color: '#F59E0B' },
  'interesado': { label: 'Interesado', color: '#3B82F6' },
  'derivado': { label: 'Derivado a Asesor', color: '#8B5CF6' },
  'convertido': { label: 'Convertido', color: '#10B981' }
};

export const LeadsWidget: React.FC<LeadsWidgetProps> = ({ leads }) => {
  const leadsByStatus = leads.reduce((acc, lead) => {
    if (!acc[lead.status]) acc[lead.status] = [];
    acc[lead.status].push(lead);
    return acc;
  }, {} as Record<string, Lead[]>);

  return (
    <div className="leads-widget">
      <h3>Gestión de Leads</h3>
      <div className="leads-summary">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = leadsByStatus[status as keyof typeof statusConfig]?.length || 0;
          return (
            <div key={status} className="lead-status-item" style={{ '--status-color': config.color } as React.CSSProperties}>
              <span className="lead-status-count">{count}</span>
              <span className="lead-status-label">{config.label}</span>
            </div>
          );
        })}
      </div>
      <div className="leads-list">
        <h4>Últimos Leads</h4>
        {leads.slice(0, 5).map(lead => (
          <div key={lead.id} className="lead-item">
            <span className="lead-name">{lead.name}</span>
            <span 
              className="lead-status-badge"
              style={{ '--badge-bg': statusConfig[lead.status]?.color + '20', '--badge-color': statusConfig[lead.status]?.color } as React.CSSProperties}
            >
              {statusConfig[lead.status]?.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
