import React from 'react';

export interface EntradaProps {
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
  [key: string]: any;
}

/**
 * Entrada (Input) stub component
 * Minimal functional implementation for type compatibility
 */
export const Entrada: React.FC<EntradaProps> = ({
  value = '',
  onChange,
  placeholder = 'Enter value',
  type = 'text',
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`entrada input-field ${className}`}
      {...props}
    />
  );
};

export default Entrada;
