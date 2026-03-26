import React from 'react';
import type { LeadDTO } from '@shared/types';

interface LeadDetailCardProps {
  lead: LeadDTO;
}

export const LeadDetailCard: React.FC<LeadDetailCardProps> = ({ lead }) => (
  <div className="lead-detail-card">
    <h3>{lead.firstName ?? ''} {lead.lastName ?? ''}</h3>
    <p>{lead.email ?? ''}</p>
    <p>{lead.phone ?? lead.telefono ?? ''}</p>
  </div>
);
