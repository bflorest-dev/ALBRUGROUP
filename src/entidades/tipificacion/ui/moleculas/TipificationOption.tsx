import React from 'react';
import type { TipificationOption as TipificationOptionType } from '@entidades/tipificacion/modelo';

// Component Props
export interface TipificationOptionProps extends TipificationOptionType {
  isSelected?: boolean;
  onSelect?: (option: TipificationOptionType) => void;
  className?: string;
}

/**
 * TipificationOptionComponent - Molecule
 * 
 * Opción individual dentro de un bloque de tipificación
 * Seleccionable para tipificar un lead
 */
export const TipificationOptionComponent: React.FC<TipificationOptionProps> = ({
  id,
  label,
  description,
  isSelected = false,
  onSelect,
  className = ''
}) => {
  return (
    <div
      className={`tipification-option ${isSelected ? 'selected' : ''} ${className}`}
      onClick={() => onSelect?.({ id, label, description })}
      role="button"
      tabIndex={0}
    >
      <span className="option-label">{label}</span>
      {description && <small className="option-description">{description}</small>}
    </div>
  );
};

export default TipificationOptionComponent;
