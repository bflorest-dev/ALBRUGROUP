/**
 * LeadsListPanel - Organism
 * 
 * Panel izquierdo que muestra la lista de leads organizados por estado
 * - Filtros de búsqueda
 * - Leads pendientes, en gestión, completadas
 * - Selección de lead
 */

import React, { useMemo } from 'react';
import { Input } from '@atoms/Input';
import { LeadListItem } from '@atoms/LeadListItem';
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
      <h3 className="section-header">
        <span className="section-icon">{icon}</span>
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
        <Input
          type="text"
          placeholder="🔍 Buscar por nombre, teléfono..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Estadísticas rápidas */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-icon">⏳</span>
          <span className="stat-value">{stats.pending}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">✓</span>
          <span className="stat-value">{stats.completed}</span>
        </div>
      </div>

      {/* Secciones de leads */}
      <div className="leads-container">
        <LeadSection
          title="PENDIENTES"
          icon="✅"
          count={stats.pending}
          leads={pendingLeads}
          className="pending"
        />

        <LeadSection
          title="COMPLETADAS"
          icon="✅"
          count={stats.completed}
          leads={completedLeads}
          className="completed"
        />
      </div>
    </div>
  );
};

export default LeadsListPanel;
