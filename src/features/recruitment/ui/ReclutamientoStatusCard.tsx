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
    <article className="group relative overflow-hidden rounded-2xl border border-[#dbe7ff] bg-gradient-to-b from-white to-[#f4f8ff] p-5 pt-6 shadow-[0_8px_18px_rgba(29,78,216,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_24px_rgba(29,78,216,0.14)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2f64dd] via-[#7eb2ff] to-[#cde2ff] opacity-80" />
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-[0.78rem] font-semibold uppercase leading-[1.2] tracking-[0.09em] text-[#40608e]">{title}</p>
          <p className="mt-2 text-5xl font-bold leading-[1.04] tracking-tight text-[#0f2a52] md:text-[3.2rem]">{value}</p>
        </div>
        <Badge
          label={variant.toUpperCase()}
          variant={variant}
          size="small"
          className="shrink-0 tracking-[0.08em]"
        />
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-[#e1ebff] pt-3.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[#3b82f6]" aria-hidden="true" />
        <p className="text-[0.95rem] leading-6 text-[#5f7598]">{subtitle}</p>
      </div>
    </article>
  );
};
