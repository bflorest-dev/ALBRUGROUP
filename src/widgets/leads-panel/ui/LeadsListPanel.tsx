/**
 * LeadsListPanel - Widget
 * 
 * Panel izquierdo que muestra la lista de leads organizados por estado
 * - Filtros de bÃºsqueda
 * - Leads pendientes, en gestiÃ³n, completadas
 * - SelecciÃ³n de lead
 */

import React, { useMemo } from 'react';
import { BiCheckCircle, BiTime, BiSearch } from 'react-icons/bi';
import { Entrada, LeadListItem } from '@shared/ui';
import type { LeadDTO } from '@shared/types';
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

interface LeadSectionProps {
  title: string;
  icon: string;
  count: number;
  leads: BackofficeLead[];
  className: string;
  selectedLeadId: string | null;
  onLeadSelect: (leadId: string) => void;
}

/**
 * Mapea identificadores de iconos de secciones a componentes
 */
const getLeadSectionIcon = (iconId: string) => {
  switch (iconId) {
    case 'pending':
      return <BiTime size={18} className="section-icon-svg" />;
    case 'completed':
      return <BiCheckCircle size={18} className="section-icon-svg" />;
    default:
      return null;
  }
};

const LeadSection: React.FC<LeadSectionProps> = ({
  title,
  icon,
  count,
  leads,
  className,
  selectedLeadId,
  onLeadSelect,
}) => (
  <div className={`leads-section ${className}`}>
    <h3 className="leads-section-header">
      <span className="section-icon">{getLeadSectionIcon(icon)}</span>
      <span className="section-title">
        {title} <span className="section-count">({count})</span>
      </span>
    </h3>
    {leads.length === 0 ? (
      <p className="empty-state">No hay leads en esta secciÃ³n</p>
    ) : (
      <div className="leads-list">
        {leads.map((lead) => (
          <LeadListItem
            key={lead.id}
            lead={lead}
            selected={selectedLeadId !== null && selectedLeadId.toString() === lead.id.toString()}
            onSelect={() => onLeadSelect(lead.id.toString())}
          />
        ))}
      </div>
    )}
  </div>
);

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

  return (
    <div className="leads-list-panel">
      {/* Encabezado con bÃºsqueda */}
      <div className="panel-header">
        <h2 className="panel-title">PREVENTAS COMPLETAS</h2>
        <p className="panel-subtitle">Total: {leads.length} leads</p>
      </div>

      {/* Buscador */}
      <div className="search-container">
        <BiSearch size={18} className="search-icon" />
        <Entrada
          type="text"
          placeholder="Buscar por nombre, teléfono..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>

      {/* EstadÃ­sticas rÃ¡pidas */}
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
          selectedLeadId={selectedLeadId}
          onLeadSelect={onLeadSelect}
        />
        <LeadSection
          title="COMPLETADAS"
          icon="completed"
          count={stats.completed}
          leads={completedLeads}
          className="completed"
          selectedLeadId={selectedLeadId}
          onLeadSelect={onLeadSelect}
        />
      </div>
    </div>
  );
};

