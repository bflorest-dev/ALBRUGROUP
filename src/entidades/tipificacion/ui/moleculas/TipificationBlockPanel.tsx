import React from 'react';
import type { TipificationBlock } from '@entidades/tipificacion/modelo';

export interface TipificationBlockPanelProps {
  block?: TipificationBlock;
  title?: string;
  data?: any;
  onUpdate?: (data: any) => void;
  className?: string;
  [key: string]: any;
}

/**
 * TipificationBlockPanel - Molecule
 * 
 * Panel para mostrar opciones de un bloque de tipificación
 * Parte de la interfaz de tipificación de leads
 */
export const TipificationBlockPanel: React.FC<TipificationBlockPanelProps> = ({
  block,
  title = 'Tipification Block',
  data = {},
  onUpdate,
  className = '',
  ...props
}) => {
  return (
    <div className={`tipification-block-panel ${className}`} {...props}>
      <div className="panel-header">
        <h4>{title || block?.label}</h4>
        {block?.description && <p className="block-description">{block.description}</p>}
      </div>
      <div className="panel-body">
        {block?.options ? (
          <div className="options-list">
            {block.options.map((option) => (
              <div key={option.id} className="option-item">
                <span className="option-label">{option.label}</span>
                {option.description && <small className="option-desc">{option.description}</small>}
              </div>
            ))}
          </div>
        ) : (
          <div>Panel data: {JSON.stringify(data)}</div>
        )}
        {onUpdate && (
          <button onClick={() => onUpdate(data)}>Update</button>
        )}
      </div>
    </div>
  );
};

export default TipificationBlockPanel;
