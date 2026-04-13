import { Modal } from '@shared/ui';
import { Calendar, Layers, Users } from 'lucide-react';
import type { OfertaLaboralResponse } from '@shared/types';
import { AmpliacionesDetail } from './AmpliacionesDetail';

interface OfertaDetallesModalProps {
  oferta: OfertaLaboralResponse;
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('es-PE', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const formatHorario = (horario: OfertaLaboralResponse['horario']): string => {
  return horario === 'AFTERNOON' ? 'Tarde' : 'Mañana';
};

const getEstadoBadgeClasses = (estado: OfertaLaboralResponse['estado']): string => {
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1';
  switch (estado) {
    case 'ACTIVO':
      return `${base} bg-emerald-50 text-emerald-700 ring-emerald-200`;
    case 'COMPLETADO':
      return `${base} bg-blue-50 text-blue-700 ring-blue-200`;
    case 'CERRADO':
      return `${base} bg-slate-100 text-slate-600 ring-slate-200`;
    case 'CANCELADO':
      return `${base} bg-amber-50 text-amber-700 ring-amber-200`;
    default:
      return `${base} bg-slate-100 text-slate-600 ring-slate-200`;
  }
};

export function OfertaDetallesModal({ oferta, isOpen, onClose }: OfertaDetallesModalProps): React.ReactElement {
  const totalVacantes =
    oferta.cantidadInicial + oferta.ampliaciones.reduce((sum, amp) => sum + amp.cantidad, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={oferta.puestoObjetivo} size="lg">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {oferta.negocio} · {formatHorario(oferta.horario)}
            </p>
            <p className="mt-1 text-sm text-slate-500">#{oferta.codigo}</p>
          </div>
          <span className={getEstadoBadgeClasses(oferta.estado)}>{oferta.estado}</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Vacantes</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{totalVacantes}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Plazo Inicial</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{formatDate(oferta.plazoInicial)}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Vacantes Iniciales</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{oferta.cantidadInicial}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Publicado</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{formatDate(oferta.createdAt)}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Historial de Ampliaciones</p>
              <p className="text-xs text-slate-500">{oferta.ampliaciones.length} registro(s)</p>
            </div>
            <Layers className="text-blue-500" size={20} />
          </div>
          {oferta.ampliaciones.length > 0 ? (
            <AmpliacionesDetail ampliaciones={oferta.ampliaciones} />
          ) : (
            <p className="text-sm text-slate-500">No hay ampliaciones registradas.</p>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="mb-4 text-sm font-semibold text-slate-900">Detalles del Puesto</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Negocio</p>
              <p className="mt-2 font-semibold text-slate-900">{oferta.negocio}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Horario</p>
              <p className="mt-2 font-semibold text-slate-900">{formatHorario(oferta.horario)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">ID Solicitante</p>
              <p className="mt-2 font-semibold text-slate-900">{oferta.idSolicitante}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Código</p>
              <p className="mt-2 font-mono font-semibold text-slate-900">{oferta.codigo}</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
