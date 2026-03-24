import React from 'react';

export interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  [key: string]: any;
}

/**
 * Button stub component
 * Minimal functional implementation for type compatibility
 */
export const Button: React.FC<ButtonProps> = ({
  children = 'Button',
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
