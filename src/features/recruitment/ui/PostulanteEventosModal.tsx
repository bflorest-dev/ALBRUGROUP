import React from 'react';
import { X } from 'lucide-react';
import { useEventosPostulante } from '../hooks/useEventosPostulante';

interface PostulanteEventosModalProps {
  isOpen: boolean;
  onClose: () => void;
  postulacionId: number;
  nombrePostulante: string;
}

const formatFecha = (value?: string): string => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const PostulanteEventosModal: React.FC<PostulanteEventosModalProps> = ({
  isOpen,
  onClose,
  postulacionId,
  nombrePostulante,
}) => {
  const { data: eventos = [], isLoading, error } = useEventosPostulante(
    postulacionId,
    isOpen
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-[min(95vw,1000px)] rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Historial: {nombrePostulante}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto px-6 py-4">
          {isLoading && (
            <div className="py-10 text-center text-sm text-gray-500">
              Cargando eventos...
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              No se pudieron cargar los eventos.
            </div>
          )}

          {!isLoading && !error && eventos.length === 0 && (
            <div className="py-10 text-center text-sm text-gray-500">
              Este postulante no tiene eventos registrados.
            </div>
          )}

          {!isLoading && !error && eventos.length > 0 && (
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-2 py-3">Fecha</th>
                  <th className="px-2 py-3">Etapa</th>
                  <th className="px-2 py-3">Acción</th>
                  <th className="px-2 py-3">Tipificación</th>
                  <th className="px-2 py-3">Subtipificación</th>
                  <th className="px-2 py-3">Modalidad</th>
                  <th className="px-2 py-3">Observación</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((evento) => (
                  <tr key={evento.id} className="border-b border-gray-100 align-top">
                    <td className="px-2 py-3 text-gray-700">
                      {formatFecha(evento.createdAt ?? evento.fecha)}
                    </td>
                    <td className="px-2 py-3 text-gray-700">{evento.etapa ?? '-'}</td>
                    <td className="px-2 py-3 text-gray-700">{evento.accion ?? '-'}</td>
                    <td className="px-2 py-3 text-gray-700">{evento.tipificacion ?? '-'}</td>
                    <td className="px-2 py-3 text-gray-700">{evento.subtipificacion ?? '-'}</td>
                    <td className="px-2 py-3 text-gray-700">{evento.modalidadContacto ?? '-'}</td>
                    <td className="px-2 py-3 text-gray-700">{evento.observacion ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
