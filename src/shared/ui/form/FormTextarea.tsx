/**
 * FormTextarea - Textarea estandarizado del Design System
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@shared/lib/utils';

const textareaVariants = cva(
  'flex w-full rounded-md border border-input bg-background text-sm ring-offset-background transition-colors',
  {
    variants: {
      size: {
        default: 'min-h-[80px] px-3 py-2',
        sm: 'min-h-[60px] px-3 py-2',
        lg: 'min-h-[120px] px-4 py-2',
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

export interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className, size, variant, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          textareaVariants({ size, variant }),
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'resize-vertical',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

FormTextarea.displayName = 'FormTextarea';

export { FormTextarea, textareaVariants };