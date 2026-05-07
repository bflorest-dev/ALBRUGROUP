import React from 'react';

interface EntradaProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Entrada: React.FC<EntradaProps> = ({ label, error, className = '', ...rest }) => {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
      <input
        className={`border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        {...rest}
      />
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
};
