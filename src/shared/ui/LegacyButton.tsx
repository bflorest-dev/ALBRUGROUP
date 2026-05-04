import React from 'react';
import {
  DsButton,
  type DsButtonSize,
  type DsButtonVariant,
} from './design-system';

/**
 * Compatibility wrapper for progressive migration to the Design System.
 * Keeps legacy API expectations without duplicating styles.
 */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

const variantMap: Record<ButtonVariant, DsButtonVariant> = {
  primary: 'primary',
  secondary: 'secondary',
  ghost: 'ghost',
  danger: 'danger',
  success: 'success',
  outline: 'outline',
};

const sizeMap: Record<ButtonSize, DsButtonSize> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <DsButton
        ref={ref}
        variant={variantMap[variant]}
        size={sizeMap[size]}
        isLoading={isLoading}
        {...props}
      >
        {isLoading ? 'Guardando...' : children}
      </DsButton>
    );
  }
);

Button.displayName = 'Button';
