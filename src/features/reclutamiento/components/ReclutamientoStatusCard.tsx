import React from 'react';
import { Badge } from '@shared/ui';

interface ReclutamientoStatusCardProps {
  title: string;
  value: number;
  subtitle: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export const ReclutamientoStatusCard: React.FC<ReclutamientoStatusCardProps> = ({
  title,
  value,
  subtitle,
  variant = 'primary',
}) => {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">{value}</p>
        </div>
        <Badge label={variant.toUpperCase()} variant={variant} size="small" />
      </div>
      <p className="mt-4 text-sm leading-6 text-gray-600">{subtitle}</p>
    </div>
  );
};
