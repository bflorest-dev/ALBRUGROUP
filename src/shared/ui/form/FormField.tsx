/**
 * FormField - Componente base para campos de formulario
 * Controla la validación visual y propaga estado a children
 */

import React, { cloneElement, isValidElement } from 'react';
import { cn } from '@shared/lib/utils';

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
  description?: string;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  children,
  required = false,
  error,
  description,
  className,
}) => {
  // Propagar estado de error a children que lo soporten
  const childrenWithError = React.Children.map(children, (child) => {
    if (isValidElement(child) && error) {
      // Forzar el tipo para acceder a props
      const props = (child as React.ReactElement<any, any>).props as Record<string, unknown>;
      if ('variant' in props) {
        return cloneElement(child, { variant: 'error' } as any);
      }
    }
    return child;
  });

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      {childrenWithError}
      
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
};