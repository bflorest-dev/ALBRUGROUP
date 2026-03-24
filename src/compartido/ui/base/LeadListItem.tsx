import React from 'react';

export interface LeadListItemProps {
  lead?: any;
  onSelect?: (lead: any) => void;
  isSelected?: boolean;
  className?: string;
  [key: string]: any;
}

/**
 * LeadListItem stub component
 * Minimal functional implementation for type compatibility
 */
export const LeadListItem: React.FC<LeadListItemProps> = ({
  lead = {},
  onSelect,
  isSelected = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`lead-list-item ${isSelected ? 'selected' : ''} ${className}`}
      onClick={() => onSelect?.(lead)}
      role="button"
      tabIndex={0}
      {...props}
    >
      <div className="item-header">{lead?.name || 'Lead'}</div>
      <div className="item-body">
        <span>{lead?.status || 'Pending'}</span>
      </div>
    </div>
  );
};

export default LeadListItem;
