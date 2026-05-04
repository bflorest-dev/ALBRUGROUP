import React from 'react';
import { dsTokens } from '../tokens';
import styles from './dsPrimitives.module.css';
import { cn } from './cn';

export type DsButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
export type DsButtonSize = 'sm' | 'md' | 'lg';

interface DsButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: DsButtonVariant;
  size?: DsButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const sizeClassMap: Record<DsButtonSize, string | undefined> = {
  sm: styles.buttonSm,
  md: styles.buttonMd,
  lg: styles.buttonLg,
};

const getVariantVars = (
  variant: DsButtonVariant
): React.CSSProperties & Record<string, string> => {
  const c = dsTokens.color;

  switch (variant) {
    case 'secondary':
      return {
        '--ds-btn-bg': c.surface,
        '--ds-btn-bg-hover': c.primarySoft,
        '--ds-btn-border': c.border,
        '--ds-btn-fg': c.primary,
        '--ds-btn-focus': c.primarySoft,
      };
    case 'ghost':
      return {
        '--ds-btn-bg': 'transparent',
        '--ds-btn-bg-hover': c.primarySoft,
        '--ds-btn-border': 'transparent',
        '--ds-btn-fg': c.primary,
        '--ds-btn-focus': c.primarySoft,
      };
    case 'danger':
      return {
        '--ds-btn-bg': c.dangerBg,
        '--ds-btn-bg-hover': c.dangerBg,
        '--ds-btn-border': c.dangerText,
        '--ds-btn-fg': c.dangerText,
        '--ds-btn-focus': c.dangerBg,
      };
    case 'success':
      return {
        '--ds-btn-bg': c.successBg,
        '--ds-btn-bg-hover': c.successBg,
        '--ds-btn-border': c.successText,
        '--ds-btn-fg': c.successText,
        '--ds-btn-focus': c.successBg,
      };
    case 'outline':
      return {
        '--ds-btn-bg': 'transparent',
        '--ds-btn-bg-hover': c.primarySoft,
        '--ds-btn-border': c.primary,
        '--ds-btn-fg': c.primary,
        '--ds-btn-focus': c.primarySoft,
      };
    case 'primary':
    default:
      return {
        '--ds-btn-bg': c.primary,
        '--ds-btn-bg-hover': c.primaryHover,
        '--ds-btn-border': c.primary,
        '--ds-btn-fg': c.surface,
        '--ds-btn-focus': c.primarySoft,
      };
  }
};

export const DsButton = React.forwardRef<HTMLButtonElement, DsButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          styles.buttonBase,
          sizeClassMap[size],
          fullWidth ? styles.buttonFull : '',
          className
        )}
        style={getVariantVars(variant)}
        {...props}
      >
        {isLoading ? <span className={styles.buttonSpinner} aria-hidden='true' /> : null}
        {children}
      </button>
    );
  }
);

DsButton.displayName = 'DsButton';
