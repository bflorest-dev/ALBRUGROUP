/**
 * FormInput - Input estandarizado del Design System
 * Consistente con el resto de componentes
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@shared/lib/utils';

const inputVariants = cva(
  'flex w-full rounded-md border border-input bg-background text-sm ring-offset-background transition-colors',
  {
    variants: {
      size: {
        default: 'h-10 px-3 py-2',
        sm: 'h-9 px-3 py-2',
        lg: 'h-11 px-4 py-2',
      },
      variant: {
        default: 'border-input',
        error: 'border-destructive focus-visible:ring-destructive',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
);

export interface FormInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  size?: 'default' | 'sm' | 'lg';
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, size, variant, type = 'text', ...props }, ref) => {
    // Forzar el tipo correcto para size
    const safeSize = (size === 'default' || size === 'sm' || size === 'lg' || size == null) ? size : 'default';
    return (
      <input
        type={type}
        className={cn(
          inputVariants({ size: safeSize, variant }),
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

FormInput.displayName = 'FormInput';

export { FormInput, inputVariants };