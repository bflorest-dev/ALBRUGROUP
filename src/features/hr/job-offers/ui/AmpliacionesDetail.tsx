/**
 * AmpliacionesDetail — Componente colapsable para mostrar ampliaciones
 * Usa toggle button con animación max-height + opacity
 * 
 * Animación:
 * - Estado cerrado: max-h-0 opacity-0 overflow-hidden
 * - Estado abierto: max-h-96 opacity-100
 * - Transición: max-height 250ms ease, opacity 200ms ease
 */

import { useState } from 'react';
import type { ReactElement } from 'react';
import { ChevronDown } from 'lucide-react';
import type { OfertaAmpliacionResponse } from '@shared/types';

interface AmpliacionesDetailProps {
  ampliaciones: OfertaAmpliacionResponse[];
}

export function AmpliacionesDetail({ ampliaciones }: AmpliacionesDetailProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  if (!ampliaciones || ampliaciones.length === 0) {
    return <></>;
  }

  const formatPlazo = (dateString: string): string => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="w-full">
      {/* Toggle Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors py-2"
        aria-expanded={isOpen}
        aria-controls="ampliaciones-panel"
      >
        <span>{ampliaciones.length} ampliaciones</span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Collapsable Panel */}
      <div
        id="ampliaciones-panel"
        className={`overflow-hidden transition-[max-height,opacity] duration-[250ms] ease-[ease] ${
          isOpen
            ? 'max-h-96 opacity-100'
            : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-brand-50 rounded-lg p-3 mt-2 border border-brand-100 space-y-2">
          {ampliaciones.map((amp, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs">
              <div className="flex-1">
                <span className="text-gray-600">Plazo: </span>
                <span className="font-mono text-brand-700">{formatPlazo(amp.plazo)}</span>
              </div>
              <div className="text-brand-800 font-semibold">
                +{amp.cantidad}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
