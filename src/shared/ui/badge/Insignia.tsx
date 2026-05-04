import React from 'react';

interface InsigniaProps {
  text: string;
  variant?: 'success' | 'warning' | 'error' | 'info';
}

export const Insignia: React.FC<InsigniaProps> = ({ text, variant = 'info' }) => {
  const variantClasses = {
    success: 'bg-green-200 text-green-800',
    warning: 'bg-yellow-200 text-yellow-800',
    error: 'bg-red-200 text-red-800',
    info: 'bg-blue-200 text-blue-800',
  };

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${variantClasses[variant]}`}>
      {text}
    </span>
  );
};
