import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * @atom Button — Shared genérico
 * Variantes: primary (default), secondary, ghost, danger
 * Tamaños: sm, md (default), lg
 * Compatible con LoadingState (isLoading prop)
 */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

const getVariantClasses = (variant: ButtonVariant): string => {
  const baseClasses = 'font-semibold transition-all duration-150 ease-out focus-visible:outline-none focus-visible:shadow-focus';

  switch (variant) {
    case 'primary':
      return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 hover:-translate-y-px active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed`;

    case 'secondary':
      return `${baseClasses} bg-white text-blue-700 border border-blue-300 hover:bg-blue-50 hover:border-blue-500 text-brand-700 border-brand-300 hover:bg-brand-50 hover:border-brand-500 disabled:opacity-40 disabled:cursor-not-allowed`;

    case 'ghost':
      return `${baseClasses} bg-transparent text-blue-700 hover:bg-blue-50 text-brand-600 hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed`;

    case 'danger':
      return `${baseClasses} bg-red-500 text-white hover:bg-red-600 active:bg-red-700 hover:-translate-y-px active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed`;

    default:
      return baseClasses;
  }
};

const getSizeClasses = (size: ButtonSize): string => {
  switch (size) {
    case 'sm':
      return 'px-3 py-1.5 text-xs gap-1.5 rounded-input';
    case 'lg':
      return 'px-5 py-3 text-base gap-2 rounded-input';
    case 'md':
    default:
      return 'px-4 py-2.5 text-sm gap-2 rounded-input';
  }
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      children,
      className,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const variantClasses = getVariantClasses(variant);
    const sizeClasses = getSizeClasses(size);
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center whitespace-nowrap ${variantClasses} ${sizeClasses} ${className || ''}`}
        {...props}
      >
        {isLoading && (
          <Loader2
            size={16}
            className="animate-spin"
            aria-hidden="true"
          />
        )}
        {isLoading ? 'Guardando...' : children}
      </button>
    );
  }
);
