import React from 'react';
import type { LeadAsesorDetalleResponse } from '@shared/types';

interface Props {
  lead: LeadAsesorDetalleResponse;
}

export const DetalleLeadInfo: React.FC<Props> = ({ lead }) => {
  return (
    <div className="card">
      <div className="card-header">
        <h5>Dirección</h5>
      </div>
      <div className="card-body">
        <p>
          <strong>{lead.direccion}</strong>
        </p>
        <small>{lead.referencia}</small>
      </div>
    </div>
  );
};
