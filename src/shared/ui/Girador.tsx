import React from 'react';
import './Girador.css';

export const Girador: React.FC<{ size?: number | string }> = ({ size = 24 }) => (
  <svg
    className="girador-svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="girador-track" cx="12" cy="12" r="10" fill="none" strokeWidth="3" />
    <path
      className="girador-head"
      d="M22 12a10 10 0 0 1-10 10"
      fill="none"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);
