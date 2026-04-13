/**
 * @molecule KanbanColumn — Columna del Kanban
 * Agrupa postulaciones por estado/tipificación
 * Renderiza tarjetas sin drag-and-drop
 */

import React from 'react';
import { KanbanCard } from './KanbanCard';
import type { PostulacionResponse } from '@features/rrhh/postulaciones/model';

interface KanbanColumnProps {
  columnId: string;
  columnLabel: string;
  postulaciones: PostulacionResponse[];
  onTipificar?: (postulacion: PostulacionResponse, columnId: string) => void;
  onDetails?: (postulacion: PostulacionResponse) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  columnId,
  columnLabel,
  postulaciones,
  onTipificar,
  onDetails,
}) => {
  const isTerminalColumn = columnId === 'NO_INTERESADO';

  return (
    <div className="flex flex-col bg-gray-50 rounded-lg p-4 min-w-[320px] max-w-[380px]">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">{columnLabel}</h3>
        <p className="text-xs text-gray-500 mt-1">
          {postulaciones.length} {postulaciones.length === 1 ? 'postulación' : 'postulaciones'}
        </p>
      </div>

      {/* Lista de tarjetas */}
      <div
        className="flex-1 space-y-3 min-h-[300px]"
      >
        {postulaciones.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            No hay postulaciones
          </div>
        ) : (
          postulaciones.map((post) => (
            <KanbanCard
              key={post.id}
              postulacion={post}
              columnId={columnId}
              onTipificar={isTerminalColumn ? undefined : onTipificar}
              onDetails={onDetails}
            />
          ))
        )}
      </div>
    </div>
  );
};
