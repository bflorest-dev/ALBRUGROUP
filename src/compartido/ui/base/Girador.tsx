import React from 'react';

export interface GiradorProps {
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  [key: string]: any;
}

/**
 * Girador (Spinner) stub component
 * Minimal functional implementation for type compatibility
 */
export const Girador: React.FC<GiradorProps> = ({
  loading = true,
  size = 'medium',
  className = '',
  ...props
}) => {
  if (!loading) return null;

  return (
    <div
      className={`spinner spinner-${size} ${className}`}
      role="status"
      {...props}
    >
      <span className="spinner-icon">⟳</span>
    </div>
  );
};

export default Girador;
