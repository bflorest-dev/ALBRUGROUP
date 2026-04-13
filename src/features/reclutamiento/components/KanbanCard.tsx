/**
 * @molecule KanbanCard — Tarjeta individual del Kanban
 * Representa una postulación en el tablero
 * Cambio de estado únicamente mediante botón Tipificar
 */

import React from 'react';
import { Phone, User, FileText } from 'lucide-react';
import type { PostulacionResponse } from '@features/rrhh/postulaciones/model';

interface KanbanCardProps {
  postulacion: PostulacionResponse;
  columnId: string;
  onTipificar?: (postulacion: PostulacionResponse, columnId: string) => void;
  onDetails?: (postulacion: PostulacionResponse) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  postulacion,
  columnId,
  onTipificar,
  onDetails,
}) => {
  const nombreCompleto = `${postulacion.postulante.nombres} ${postulacion.postulante.apellidos}`;

  return (
    <div
      className={`
        rounded-lg border border-gray-200 bg-white p-4 shadow-sm
        hover:shadow-md transition-all duration-150
      `}
    >
      {/* Header: Nombre + Documento */}
      <div className="mb-3">
        <p className="font-semibold text-sm text-gray-900 truncate">
          {nombreCompleto}
        </p>
        <p className="text-xs text-gray-500">
          {postulacion.postulante.tipoDocumento}: {postulacion.postulante.documento}
        </p>
      </div>

      {/* Info: Celular + Oferta */}
      <div className="mb-3 space-y-2">
        {postulacion.postulante.celular && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Phone size={14} />
            <span>{postulacion.postulante.celular}</span>
          </div>
        )}
        {postulacion.ofertaLaboral && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <FileText size={14} />
            <span className="font-medium">{postulacion.ofertaLaboral.codigo}</span>
          </div>
        )}
      </div>

      {/* Origen Badge */}
      {postulacion.origen && (
        <div className="mb-3">
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded">
            {postulacion.origen}
          </span>
        </div>
      )}

      {/* Acciones */}
      {(onTipificar || onDetails) && (
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          {onTipificar && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTipificar(postulacion, columnId);
              }}
              className="flex-1 py-2 px-3 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              Tipificar
            </button>
          )}
          {onDetails && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDetails(postulacion);
              }}
              className="flex-1 py-2 px-3 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              <User size={14} className="inline mr-1" />
              Ver más
            </button>
          )}
        </div>
      )}
    </div>
  );
};
