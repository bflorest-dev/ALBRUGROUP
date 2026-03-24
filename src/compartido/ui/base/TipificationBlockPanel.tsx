import React from 'react';

export interface TipificationBlockPanelProps {
  title?: string;
  data?: any;
  onUpdate?: (data: any) => void;
  className?: string;
  [key: string]: any;
}

/**
 * TipificationBlockPanel stub component
 * Minimal functional implementation for type compatibility
 */
export const TipificationBlockPanel: React.FC<TipificationBlockPanelProps> = ({
  title = 'Tipification Block',
  data = {},
  onUpdate,
  className = '',
  ...props
}) => {
  return (
    <div className={`tipification-block-panel ${className}`} {...props}>
      <div className="panel-header">
        <h4>{title}</h4>
      </div>
      <div className="panel-body">
        <div>Panel data: {JSON.stringify(data)}</div>
        {onUpdate && (
          <button onClick={() => onUpdate(data)}>Update</button>
        )}
      </div>
    </div>
  );
};

export default TipificationBlockPanel;
