/**
 * OfertaCard — Tarjeta de oferta laboral con jerarquía visual
 */

import { useState } from 'react';
import { ChevronRight, Users, Calendar, Layers } from 'lucide-react';
import type { OfertaLaboralResponse, EstadoOferta } from '@shared/types';
import { useActualizarEstadoOferta } from '../model/useOfertasActivas';

interface OfertaCardProps {
  oferta: OfertaLaboralResponse;
  index?: number;
  onEstadoActualizado?: (ofertaActualizada: OfertaLaboralResponse) => void;
  onOpenDetails?: (oferta: OfertaLaboralResponse) => void;
  onOpenAmpliar?: (oferta: OfertaLaboralResponse) => void;
}

const getEstadoBadgeClasses = (estado: EstadoOferta): string => {
  const baseClasses = 'text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-md ring-1';
  switch (estado) {
    case 'ACTIVO':
      return `${baseClasses} bg-green-50 text-green-700 ring-green-200`;
    case 'COMPLETADO':
      return `${baseClasses} bg-blue-50 text-blue-700 ring-blue-200`;
    case 'CERRADO':
      return `${baseClasses} bg-slate-100 text-slate-500 ring-slate-200`;
    case 'CANCELADO':
      return `${baseClasses} bg-amber-50 text-amber-700 ring-amber-200`;
    default:
      return `${baseClasses} bg-slate-100 text-slate-500 ring-slate-200`;
  }
};

export function OfertaCard({ oferta, index = 0, onEstadoActualizado, onOpenDetails, onOpenAmpliar }: OfertaCardProps): React.ReactElement {
  const actualizarEstadoMutation = useActualizarEstadoOferta();
  const [isUpdatingEstado, setIsUpdatingEstado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ofertaActual, setOfertaActual] = useState(oferta);

  const formatPlazo = (dateString: string): string => {
    const [year, month, day] = dateString.split('-');
    return `${day} ${new Date(`${dateString}T00:00:00`).toLocaleString('es-PE', {
      month: 'short',
    })} ${year}`;
  };

  const handleEstadoChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoEstado = e.target.value as EstadoOferta;

    try {
      setIsUpdatingEstado(true);
      setError(null);

      const ofertaActualizada = await actualizarEstadoMutation.mutateAsync({
        ofertaId: ofertaActual.id,
        body: { estado: nuevoEstado },
      });

      setOfertaActual(ofertaActualizada);
      onEstadoActualizado?.(ofertaActualizada);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
    } finally {
      setIsUpdatingEstado(false);
    }
  };

  const totalVacantes =
    ofertaActual.cantidadInicial +
    ofertaActual.ampliaciones.reduce((sum, amp) => sum + amp.cantidad, 0);

  const isStateReadOnly = ofertaActual.estado === 'CANCELADO' || ofertaActual.estado === 'COMPLETADO';
  const vacantesCompletadas = ofertaActual.cantidadInicial >= totalVacantes;

  return (
    <div
      className="animate-fadeSlideUp flex min-h-[220px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* CardHeader — pb-3 */}
      <div className="pb-3">
        {/* Row 1: Título + Badge */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-bold leading-tight tracking-tight text-slate-900">
            {ofertaActual.puestoObjetivo}
          </h3>

          <div className="flex items-center gap-1.5 shrink-0">
            {isStateReadOnly ? (
              <span className={getEstadoBadgeClasses(ofertaActual.estado)}>{ofertaActual.estado}</span>
            ) : (
              <select
                value={ofertaActual.estado}
                onChange={handleEstadoChange}
                disabled={isUpdatingEstado}
                className={`${getEstadoBadgeClasses(ofertaActual.estado)} border-none bg-transparent outline-none cursor-pointer`}
                aria-label={`Estado de ${ofertaActual.codigo}`}
              >
                <option value="ACTIVO">ACTIVO</option>
                <option value="COMPLETADO">COMPLETADO</option>
                <option value="CERRADO">CERRADO</option>
                <option value="CANCELADO">CANCELADO</option>
              </select>
            )}
          </div>
        </div>

        {/* Row 2: Meta (Negocio · Turno · Código) */}
        <div className="text-xs font-medium tracking-wide text-slate-400 mt-1 flex items-center gap-1">
          <span className="font-semibold uppercase text-slate-500">{ofertaActual.negocio}</span>
          <span className="mx-0.5 text-slate-300">·</span>
          <span>{ofertaActual.horario}</span>
          <span className="mx-0.5 text-slate-300">·</span>
          <span className="font-mono text-slate-400">#{ofertaActual.codigo}</span>
        </div>
      </div>

      {/* CardContent — py-0, gap-2 maneja separación */}
      <div className="flex flex-col gap-2">
        {/* Vacantes + Plazo */}
        <div className="flex items-center gap-6">
          {/* Vacantes */}
          <div className="flex items-center gap-2">
            <Users size={15} className="text-blue-400 shrink-0" />
            <span className="text-sm text-slate-500">Vacantes:</span>
            <span className={`text-sm font-bold ${vacantesCompletadas ? 'text-emerald-600' : 'text-blue-600'}`}>
              {ofertaActual.cantidadInicial}/{totalVacantes}
            </span>
          </div>

          {/* Plazo */}
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-blue-400 shrink-0" />
            <span className="text-sm text-slate-500">Plazo:</span>
            <span className="text-sm font-semibold text-slate-700">{formatPlazo(ofertaActual.plazoInicial)}</span>
          </div>
        </div>

        {/* Ampliaciones */}
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Layers size={15} className={`shrink-0 ${ofertaActual.ampliaciones.length > 0 ? 'text-blue-400' : 'text-slate-300'}`} />
          <span className={ofertaActual.ampliaciones.length > 0 ? 'font-medium text-blue-500' : ''}>
            {ofertaActual.ampliaciones.length} ampliación(es)
          </span>
        </div>
      </div>

      {/* CardFooter — border-t, pt-4, mt-2 */}
      <div className="border-t border-slate-100 pt-4 mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onOpenDetails?.(ofertaActual)}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 transition-colors duration-150 bg-transparent border-none cursor-pointer p-0"
        >
          Ver Detalles
        </button>

        {!isStateReadOnly && (
          <button
            type="button"
            onClick={() => onOpenAmpliar?.(ofertaActual)}
            className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors duration-150 bg-transparent border-none cursor-pointer p-0"
          >
            Ampliar <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
