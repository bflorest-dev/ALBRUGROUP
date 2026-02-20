import React from 'react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...rest
}) => {
  const cls = `atom-button ${variant} ${size} ${className}`.trim();
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
};

export default Button;