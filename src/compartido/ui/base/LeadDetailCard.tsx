import React from 'react';

export interface LeadDetailCardProps {
  lead?: any;
  className?: string;
  [key: string]: any;
}

/**
 * LeadDetailCard stub component
 * Minimal functional implementation for type compatibility
 */
export const LeadDetailCard: React.FC<LeadDetailCardProps> = ({
  lead = {},
  className = '',
  ...props
}) => {
  return (
    <div className={`lead-detail-card ${className}`} {...props}>
      <div className="card-header">
        <h4>Lead Details</h4>
      </div>
      <div className="card-body">
        <p>Lead ID: {lead?.id || 'N/A'}</p>
        <p>Name: {lead?.name || 'N/A'}</p>
        <p>Status: {lead?.status || 'N/A'}</p>
      </div>
    </div>
  );
};

export default LeadDetailCard;
