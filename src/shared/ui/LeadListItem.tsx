import React from 'react';
import type { LeadDTO } from '@shared/types';

interface LeadListItemProps {
  lead: LeadDTO;
  onSelect?: () => void;
  selected?: boolean;
}

export const LeadListItem: React.FC<LeadListItemProps> = ({ lead, onSelect, selected }) => (
  <div className={`lead-list-item ${selected ? 'selected' : ''}`} onClick={onSelect}>
    <div>{lead.firstName ?? ''} {lead.lastName ?? ''}</div>
    <div>{lead.phone ?? lead.telefono ?? ''}</div>
  </div>
);
