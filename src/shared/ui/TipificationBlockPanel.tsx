import React from 'react';
import type { TipificationBlock, TipificationOptionId } from '@shared/types';

interface TipificationBlockPanelProps {
  block: TipificationBlock;
  selectedOptionId?: TipificationOptionId;
  onSelectOption?: (optionId: TipificationOptionId) => void;
  onFilterByBlock?: () => void;
  showFilter?: boolean;
}

export const TipificationBlockPanel: React.FC<TipificationBlockPanelProps> = ({
  block,
  selectedOptionId,
  onSelectOption,
  onFilterByBlock,
  showFilter = false,
}) => (
  <div className="tipification-block-panel">
    <h4>{block.name}</h4>
    {showFilter && onFilterByBlock && (
      <button onClick={onFilterByBlock}>Filtrar</button>
    )}
    <ul>
      {block.options.map((option) => (
        <li key={option.id}>
          <button
            className={selectedOptionId === option.id ? 'selected' : ''}
            onClick={() => onSelectOption?.(option.id)}
          >
            {option.label}
          </button>
        </li>
      ))}
    </ul>
  </div>
);
