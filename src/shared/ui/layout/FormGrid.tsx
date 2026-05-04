/**
 * FormGrid - Layout estandarizado para formularios
 * Cubre casos reales de responsive y columnas dinámicas
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@shared/lib/utils';

const formGridVariants = cva(
  'grid',
  {
    variants: {
      cols: {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
        5: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5',
        6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6',
        auto: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      },
      gap: {
        xs: 'gap-1',
        sm: 'gap-2',
        default: 'gap-4',
        lg: 'gap-6',
        xl: 'gap-8',
      },
      responsive: {
        default: '', // usa las cols por defecto
        mobile2: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
        tablet3: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4',
        custom: '', // permite override completo
      },
    },
    defaultVariants: {
      cols: 2,
      gap: 'default',
      responsive: 'default',
    },
  }
);

export interface FormGridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof formGridVariants> {
  /**
   * Para casos muy específicos, permite override completo
   * Usar solo cuando las variantes no cubran el caso
   */
  customCols?: string;
}

const FormGrid = React.forwardRef<HTMLDivElement, FormGridProps>(
  ({ className, cols, gap, responsive, customCols, ...props }, ref) => {
    // Si se proporciona customCols, úsalo en lugar de las variantes
    const gridClasses = customCols 
      ? `grid ${customCols}`
      : formGridVariants({ cols: responsive === 'default' ? cols : undefined, gap, responsive });

    return (
      <div
        className={cn(gridClasses, className)}
        ref={ref}
        {...props}
      />
    );
  }
);

FormGrid.displayName = 'FormGrid';

export { FormGrid, formGridVariants };