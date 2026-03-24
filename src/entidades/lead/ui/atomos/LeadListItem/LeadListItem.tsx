/**
 * LeadListItem - Atom
 * 
 * Card compacta que representa un lead en la lista
 * Muestra: Cliente, Teléfono, Canal, Estado de tipificación
 */

import React from 'react';
import { BiCheck, BiTime } from 'react-icons/bi';
import type { LeadDTO } from '@compartido/tipos';
import './LeadListItem.css';

interface LeadListItemProps {
  lead: LeadDTO & {dni?: string};
  isSelected: boolean;
  tipificationStatus?: 'pending' | 'tipified';
  tipificationLabel?: string;
  onClick: () => void;
}

export const LeadListItem: React.FC<LeadListItemProps> = ({
  lead,
  isSelected,
  tipificationStatus = 'pending',
  onClick
}) => {
  const getStatusBadge = () => {
    switch (tipificationStatus) {
      case 'tipified':
        return <span className="status-badge tipified"><BiCheck size={14} /></span>;
      case 'pending':
      default:
        return <span className="status-badge pending"><BiTime size={14} /></span>;
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
          <span className="lead-channel-badge">{(lead as any).dni || lead.channel}</span>
          {getStatusBadge()}
        </div>
      </div>
    </div>
  );
};

export default LeadListItem;
