import React from 'react';

export const Girador: React.FC<{ size?: number | string }> = ({ size = 24 }) => (
  <div style={{ width: size, height: size, border: '3px solid #ccc', borderTop: '3px solid #333', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
);
