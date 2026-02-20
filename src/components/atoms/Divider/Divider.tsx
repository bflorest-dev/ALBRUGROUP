import React from 'react';
import './Divider.css';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  thickness?: number;
  color?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  thickness = 1,
  color = '#e5e7eb',
}) => (
  <div
    className={`atom-divider atom-divider--${orientation}`}
    style={{
      backgroundColor: color,
      [orientation === 'horizontal' ? 'height' : 'width']: thickness,
    }}
  />
);

export default Divider;
