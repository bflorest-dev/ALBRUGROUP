/**
 * TipificationBlockPanel - Molecule
 * 
 * Panel que muestra un bloque de tipificación con sus opciones
 * Permite seleccionar una opción y filtrar por ese bloque
 */

import React, { useState, useEffect } from 'react';
import { BiChevronDown, BiChevronRight, BiSearch, BiCheckCircle, BiTimeFive, BiX, BiPhone, BiHourglass, BiRefresh, BiCalendarAlt, BiErrorCircle, BiXCircle } from 'react-icons/bi';
import type { TipificationBlock, TipificationOptionId } from '@compartido/tipos';
import { TipificationOption } from '@compartido/ui/atomos';
import './TipificationBlockPanel.css';

/**
 * Mapea identificadores de iconos a componentes de react-icons
 */
const getIconComponent = (iconId: string) => {
  switch (iconId) {
    case 'check':
    case 'check-circle':
      return <BiCheckCircle size={18} style={{display: 'inline', marginRight: '6px'}} />;
    case 'clock':
      return <BiTimeFive size={18} style={{display: 'inline', marginRight: '6px'}} />;
    case 'x':
      return <BiX size={18} style={{display: 'inline', marginRight: '6px'}} />;
    case 'phone':
      return <BiPhone size={18} style={{display: 'inline', marginRight: '6px'}} />;
    case 'hourglass':
      return <BiHourglass size={18} style={{display: 'inline', marginRight: '6px'}} />;
    case 'sync':
      return <BiRefresh size={18} style={{display: 'inline', marginRight: '6px'}} />;
    case 'search':
      return <BiSearch size={18} style={{display: 'inline', marginRight: '6px'}} />;
    case 'calendar':
      return <BiCalendarAlt size={18} style={{display: 'inline', marginRight: '6px'}} />;
    case 'alert-circle':
      return <BiErrorCircle size={18} style={{display: 'inline', marginRight: '6px'}} />;
    case 'ban':
      return <BiXCircle size={18} style={{display: 'inline', marginRight: '6px'}} />;
    default:
      return null;
  }
};

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
  isExpanded = false,
  onSelectOption,
  onFilterByBlock,
  showFilter = true
}) => {
  const [isOpen, setIsOpen] = useState(isExpanded || !!selectedOptionId);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  // Auto-abrir cuando se selecciona una opción
  useEffect(() => {
    if (selectedOptionId) {
      setIsOpen(true);
    }
  }, [selectedOptionId]);

  return (
    <div className="tipification-block-panel">
      <div className="block-header" onClick={handleToggle}>
        <div className="block-title-section">
          <span className="block-panel-icon">{getIconComponent(block.icon)}</span>
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
              <BiSearch size={16} />
            </button>
          )}
          <button
            className={`btn-toggle ${isOpen ? 'open' : 'closed'}`}
            aria-expanded={isOpen}
          >
            {isOpen ? <BiChevronDown size={16} /> : <BiChevronRight size={16} />}
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
