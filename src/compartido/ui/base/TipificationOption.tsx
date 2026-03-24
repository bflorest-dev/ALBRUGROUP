import React from 'react';

// Type definition
export interface TipificationOption {
  id: string;
  label: string;
  value: string;
  category?: string;
}

// Component stub
export interface TipificationOptionProps extends TipificationOption {
  isSelected?: boolean;
  onSelect?: (option: TipificationOption) => void;
  className?: string;
  [key: string]: any;
}

/**
 * TipificationOption stub component
 * Minimal functional implementation for type compatibility
 */
export const TipificationOption: React.FC<TipificationOptionProps> = ({
  id,
  label,
  value,
  category,
  isSelected = false,
  onSelect,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`tipification-option ${isSelected ? 'selected' : ''} ${className}`}
      onClick={() => onSelect?.({ id, label, value, category })}
      role="button"
      tabIndex={0}
      {...props}
    >
      <span className="option-label">{label}</span>
      {category && <span className="option-category">{category}</span>}
    </div>
  );
};

export default TipificationOption;
