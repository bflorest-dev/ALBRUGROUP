/**
 * LeadsListPanel - Widget
 * 
 * Panel izquierdo que muestra la lista de leads organizados por estado
 * - Filtros de búsqueda
 * - Leads pendientes, en gestión, completadas
 * - Selección de lead
 */

import React, { useMemo } from 'react';
import { BiCheckCircle, BiTime, BiSearch } from 'react-icons/bi';
import { Entrada } from '@compartido/ui/atomos/campos';
import { LeadListItem } from '@entidades/lead/ui';
import type { LeadDTO } from '@compartido/tipos';
import './LeadsListPanel.css';

interface BackofficeLead extends LeadDTO {
  tipificationStatus?: 'pending' | 'tipified';
  tipificationLabel?: string;
}

interface LeadsListPanelProps {
  leads: BackofficeLead[];
  selectedLeadId: string | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onLeadSelect: (leadId: string) => void;
}

/**
 * Mapea identificadores de iconos de secciones a componentes
 */
const getLeadSectionIcon = (iconId: string) => {
  switch (iconId) {
    case 'pending':
      return <BiTime size={18} style={{display: 'inline', marginRight: '6px'}} />;
    case 'completed':
      return <BiCheckCircle size={18} style={{display: 'inline', marginRight: '6px'}} />;
    default:
      return null;
  }
};

export const LeadsListPanel: React.FC<LeadsListPanelProps> = ({
  leads,
  selectedLeadId,
  searchTerm,
  onSearchChange,
  onLeadSelect
}) => {
  // Agrupar leads por estado
  const pendingLeads = useMemo(
    () => leads.filter((lead) => lead.tipificationStatus !== 'tipified'),
    [leads]
  );

  const completedLeads = useMemo(
    () => leads.filter((lead) => lead.tipificationStatus === 'tipified'),
    [leads]
  );

  // Contar por estado
  const stats = useMemo(
    () => ({
      pending: pendingLeads.length,
      completed: completedLeads.length
    }),
    [pendingLeads, completedLeads]
  );

  const LeadSection = ({
    title,
    icon,
    count,
    leads: sectionLeads,
    className
  }: {
    title: string;
    icon: string;
    count: number;
    leads: BackofficeLead[];
    className: string;
  }) => (
    <div className={`leads-section ${className}`}>
      <h3 className="leads-section-header">
        <span className="section-icon">{getLeadSectionIcon(icon)}</span>
        <span className="section-title">
          {title} <span className="section-count">({count})</span>
        </span>
      </h3>
      {sectionLeads.length === 0 ? (
        <p className="empty-state">No hay leads en esta sección</p>
      ) : (
        <div className="leads-list">
          {sectionLeads.map((lead) => (
            <LeadListItem
              key={lead.id}
              lead={lead}
              isSelected={selectedLeadId === lead.id}
              tipificationStatus={lead.tipificationStatus}
              tipificationLabel={lead.tipificationLabel}
              onClick={() => onLeadSelect(lead.id)}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="leads-list-panel">
      {/* Encabezado con búsqueda */}
      <div className="panel-header">
        <h2 className="panel-title">PREVENTAS COMPLETAS</h2>
        <p className="panel-subtitle">Total: {leads.length} leads</p>
      </div>

      {/* Buscador */}
      <div className="search-container">
        <BiSearch size={18} style={{position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280'}} />
        <Entrada
          type="text"
          placeholder="Buscar por nombre, teléfono..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
          style={{paddingLeft: '32px'}}
        />
      </div>

      {/* Estadísticas rápidas */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-icon"><BiTime size={16} /></span>
          <span className="leads-stat-value">{stats.pending}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon"><BiCheckCircle size={16} /></span>
          <span className="leads-stat-value">{stats.completed}</span>
        </div>
      </div>

      {/* Secciones de leads */}
      <div className="leads-container">
        <LeadSection
          title="PENDIENTES"
          icon="pending"
          count={stats.pending}
          leads={pendingLeads}
          className="pending"
        />
        <LeadSection
          title="COMPLETADAS"
          icon="completed"
          count={stats.completed}
          leads={completedLeads}
          className="completed"
        />
      </div>
    </div>
  );
};
