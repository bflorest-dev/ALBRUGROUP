import React from 'react';
import './Spinner.css';

interface SpinnerProps {
  size?: number;
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 24, color = '#2563EB' }) => (
  <div
    className="atom-spinner"
    style={{ width: size, height: size, borderColor: color }}
    aria-label="Loading"
  />
);

export default Spinner;
