/**
 * LeadListItem - Atom
 * 
 * Card compacta que representa un lead en la lista
 * Muestra: Cliente, Teléfono, Canal, Estado de tipificación
 */

import React from 'react';
import type { LeadDTO } from '@shared/types';
import './LeadListItem.css';

interface LeadListItemProps {
  lead: LeadDTO;
  isSelected: boolean;
  tipificationStatus?: 'pending' | 'tipified';
  tipificationLabel?: string;
  onClick: () => void;
}

export const LeadListItem: React.FC<LeadListItemProps> = ({
  lead,
  isSelected,
  tipificationStatus = 'pending',
  tipificationLabel,
  onClick
}) => {
  const getStatusBadge = () => {
    switch (tipificationStatus) {
      case 'tipified':
        return <span className="status-badge tipified">✓</span>;
      case 'pending':
      default:
        return <span className="status-badge pending">⏳</span>;
    }
  };

  return (
    <div
      className={`lead-list-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      <div className="lead-item-header">
        <div className="client-info">
          <h4 className="client-name">
            {lead.firstName} {lead.lastName}
          </h4>
          <p className="client-phone">{lead.phone}</p>
        </div>
        <div className="lead-meta">
          <span className="channel-badge">{lead.channel}</span>
          {getStatusBadge()}
        </div>
      </div>
      
      {tipificationLabel && (
        <div className="tipification-info">
          <small>{tipificationLabel}</small>
        </div>
      )}
    </div>
  );
};

export default LeadListItem;
