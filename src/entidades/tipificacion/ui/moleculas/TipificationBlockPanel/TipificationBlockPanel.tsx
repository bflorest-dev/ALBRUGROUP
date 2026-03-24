/**
 * TipificationBlockPanel - Molecule
 * 
 * Panel que muestra un bloque de tipificación con sus opciones
 * Permite seleccionar una opción y filtrar por ese bloque
 */

import React, { useState, useEffect } from 'react';
import { BiChevronDown, BiChevronRight, BiSearch, BiCheckCircle, BiTimeFive, BiX, BiPhone, BiHourglass, BiRefresh, BiCalendarAlt, BiErrorCircle, BiXCircle } from 'react-icons/bi';
import type { TipificationBlock, TipificationOptionId } from '@entidades/tipificacion/modelo';
import { TipificationOption } from '@entidades/tipificacion/ui';
import './TipificationBlockPanel.css';

/**
 * Tipos válidos de iconos para bloques de tipificación
 */
type IconId = 'check' | 'check-circle' | 'clock' | 'x' | 'phone' | 'hourglass' | 'sync' | 'search' | 'calendar' | 'alert-circle' | 'ban';

/**
 * Mapea identificadores de iconos a componentes de react-icons
 */
const getIconComponent = (iconId: string): React.ReactNode => {
  const id = iconId as IconId;
  const iconProps = { size: 18, style: { display: 'inline' as const, marginRight: '6px' } };
  
  switch (id) {
    case 'check':
    case 'check-circle':
      return <BiCheckCircle {...iconProps} />;
    case 'clock':
      return <BiTimeFive {...iconProps} />;
    case 'x':
      return <BiX {...iconProps} />;
    case 'phone':
      return <BiPhone {...iconProps} />;
    case 'hourglass':
      return <BiHourglass {...iconProps} />;
    case 'sync':
      return <BiRefresh {...iconProps} />;
    case 'search':
      return <BiSearch {...iconProps} />;
    case 'calendar':
      return <BiCalendarAlt {...iconProps} />;
    case 'alert-circle':
      return <BiErrorCircle {...iconProps} />;
    case 'ban':
      return <BiXCircle {...iconProps} />;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selectedOptionId && !isOpen) {
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
                onSelect={() => onSelectOption(option.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TipificationBlockPanel;
