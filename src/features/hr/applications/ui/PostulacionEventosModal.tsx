import React from 'react';
import { Spinner, ErrorState } from '@shared/ui';
import { useEventosPostulacion } from '../hooks';

interface PostulacionEventosModalProps {
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

export const PostulacionEventosModal: React.FC<PostulacionEventosModalProps> = ({
  postulacionId,
  nombrePostulante,
}) => {
  const eventosHook = useEventosPostulacion(postulacionId);
  const eventos = Array.isArray(eventosHook.data) ? eventosHook.data : [];

  if (eventosHook.loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size="medium" />
      </div>
    );
  }

  if (eventosHook.error) {
    return <ErrorState message={eventosHook.error} onRetry={() => eventosHook.refetch()} />;
  }

  if (eventos.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
        No hay eventos registrados para {nombrePostulante}.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Historial de {nombrePostulante}
      </p>
      <div className="max-h-[70vh] overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Etapa</th>
              <th className="px-3 py-2">Accion</th>
              <th className="px-3 py-2">Tipificacion</th>
              <th className="px-3 py-2">Subtipificacion</th>
              <th className="px-3 py-2">Modalidad</th>
              <th className="px-3 py-2">Observacion</th>
            </tr>
          </thead>
          <tbody>
            {eventos.map((evento) => (
              <tr key={evento.id} className="border-b border-gray-100 align-top dark:border-gray-800">
                <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                  {formatFecha(evento.createdAt ?? evento.fecha)}
                </td>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{evento.etapa ?? '-'}</td>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{evento.accion ?? '-'}</td>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{evento.tipificacion ?? '-'}</td>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{evento.subtipificacion ?? '-'}</td>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{evento.modalidadContacto ?? '-'}</td>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{evento.observacion ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
