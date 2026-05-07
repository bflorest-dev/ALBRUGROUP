/**
 * FormSelect - Select estandarizado del Design System
 * API consistente con FormInput y FormTextarea
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@shared/lib/utils';
import { ChevronDown } from 'lucide-react';

const selectVariants = cva(
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

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface FormSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof selectVariants> {
  options?: SelectOption[];
  placeholder?: string;
}

const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className, size, variant, options = [], placeholder = 'Seleccione...', children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            selectVariants({ size, variant }),
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'appearance-none pr-8',
            className
          )}
          ref={ref}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';

export { FormSelect, selectVariants };