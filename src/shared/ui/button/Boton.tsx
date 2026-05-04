import React from 'react';
import { DsButton } from '../design-system';

interface BotonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Boton: React.FC<BotonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
  ...rest
}) => {
  return (
    <DsButton
      variant={variant}
      size={size}
      className={className}
      {...rest}
    >
      {children}
    </DsButton>
  );
};
