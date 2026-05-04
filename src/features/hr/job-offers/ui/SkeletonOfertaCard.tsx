/**
 * SkeletonOfertaCard — Placeholder animado con shimmer effect
 * Replica la estructura de OfertaCard durante la carga
 * Usa clase .shimmer con keyframes definidos en index.css
 */

import type { ReactElement } from 'react';

export function SkeletonOfertaCard(): ReactElement {
  return (
    <div
      className="bg-white rounded-card border border-surface-border shadow-card flex flex-col p-5 gap-4"
      role="status"
      aria-label="Cargando oferta"
      aria-hidden="true"
    >
      {/* Header: Badge + Fecha */}
      <div className="flex justify-between items-start">
        <div className="shimmer w-16 h-4 rounded-badge" />
        <div className="shimmer w-20 h-3" />
      </div>

      {/* Title */}
      <div className="space-y-1">
        <div className="shimmer w-3/4 h-5 rounded" />
      </div>

      {/* Meta */}
      <div className="shimmer w-1/2 h-3 rounded" />

      {/* Divider */}
      <div className="shimmer w-full h-0.5 rounded" />

      {/* Stats */}
      <div className="flex gap-4">
        <div>
          <div className="shimmer w-8 h-4 mb-1 rounded" />
          <div className="shimmer w-16 h-2 rounded" />
        </div>
        <div>
          <div className="shimmer w-8 h-4 mb-1 rounded" />
          <div className="shimmer w-16 h-2 rounded" />
        </div>
      </div>

      {/* Ampliaciones placeholder */}
      <div className="space-y-1">
        <div className="shimmer w-32 h-3 rounded" />
      </div>

      {/* Divider */}
      <div className="shimmer w-full h-0.5 rounded mt-auto pt-3" />

      {/* Button */}
      <div className="flex justify-end">
        <div className="shimmer w-24 h-7 rounded-input" />
      </div>
    </div>
  );
}
