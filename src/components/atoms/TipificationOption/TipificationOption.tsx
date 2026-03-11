/**
 * TipificationOption - Atom
 * 
 * Radio button customizado para opciones de tipificación
 * Muestra: Ícono, Etiqueta, Descripción
 */

import React from 'react';
import './TipificationOption.css';

interface TipificationOptionProps {
  id: string;
  label: string;
  description?: string;
  isSelected: boolean;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
}

export const TipificationOption: React.FC<TipificationOptionProps> = ({
  id,
  label,
  description,
  isSelected,
  icon,
  onClick,
  disabled = false
}) => {
  return (
    <label className={`tipification-option ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}>
      <input
        type="radio"
        name={`tipification-${id}`}
        checked={isSelected}
        onChange={onClick}
        disabled={disabled}
        className="option-radio"
      />
      
      <div className="option-content">
        {icon && <span className="option-icon">{icon}</span>}
        <div className="option-text">
          <span className="option-label">{label}</span>
          {description && <span className="option-description">{description}</span>}
        </div>
      </div>
    </label>
  );
};

export default TipificationOption;
