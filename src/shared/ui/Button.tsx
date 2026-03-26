import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  variant?: string;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ label, children, variant, ...props }) => (
  <button data-variant={variant} {...props}>{children ?? label}</button>
);
