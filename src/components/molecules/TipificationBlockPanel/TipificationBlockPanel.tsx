/**
 * TipificationBlockPanel - Molecule
 * 
 * Panel que muestra un bloque de tipificación con sus opciones
 * Permite seleccionar una opción y filtrar por ese bloque
 */

import React, { useState } from 'react';
import type { TipificationBlock, TipificationOptionId } from '@shared/types';
import { TipificationOption } from '@atoms/TipificationOption';
import './TipificationBlockPanel.css';

interface TipificationBlockPanelProps {
  block: TipificationBlock;
  selectedOptionId?: TipificationOptionId;
  isExpanded?: boolean;
  onSelectOption: (optionId: TipificationOptionId) => void;
  onFilterByBlock?: () => void;
  showFilter?: boolean;
}

export const TipificationBlockPanel: React.FC<TipificationBlockPanelProps> = ({
  block,
  selectedOptionId,
  isExpanded = true,
  onSelectOption,
  onFilterByBlock,
  showFilter = true
}) => {
  const [isOpen, setIsOpen] = useState(isExpanded);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="tipification-block-panel">
      <div className="block-header" onClick={handleToggle}>
        <div className="block-title-section">
          <span className="block-icon">{block.icon}</span>
          <div className="block-titles">
            <h3 className="block-label">{block.label}</h3>
            {block.description && (
              <p className="block-description">{block.description}</p>
            )}
          </div>
        </div>
        
        <div className="block-actions">
          {showFilter && onFilterByBlock && (
            <button
              className="btn-filter"
              onClick={(e) => {
                e.stopPropagation();
                onFilterByBlock();
              }}
              title={`Filtrar por ${block.label}`}
            >
              🔍
            </button>
          )}
          <button
            className={`btn-toggle ${isOpen ? 'open' : 'closed'}`}
            aria-expanded={isOpen}
          >
            {isOpen ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="block-content">
          <div className="options-list">
            {block.options.map((option) => (
              <TipificationOption
                key={option.id}
                id={option.id}
                label={option.label}
                description={option.description}
                isSelected={selectedOptionId === option.id}
                onClick={() => onSelectOption(option.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TipificationBlockPanel;
