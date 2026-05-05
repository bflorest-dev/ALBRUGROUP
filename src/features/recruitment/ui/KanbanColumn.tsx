/**
 * @molecule KanbanColumn — Columna del Kanban
 * Agrupa postulaciones por estado/tipificación
 * Renderiza tarjetas sin drag-and-drop
 */

import React from 'react';
import { Inbox } from 'lucide-react';
import { KanbanCard } from './KanbanCard';
import type { PostulacionResponse } from '@features/hr/applications/model';

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
  const countLabel = `${postulaciones.length} ${postulaciones.length === 1 ? 'postulación' : 'postulaciones'}`;

  return (
    <div
      className={[
        'flex min-w-[290px] max-w-[336px] flex-col rounded-2xl border p-4 shadow-[0_10px_22px_rgba(29,78,216,0.1)]',
        isTerminalColumn
          ? 'border-[#f2d5d8] bg-gradient-to-b from-[#fff9f9] to-[#fff3f4]'
          : 'border-[#dbe7ff] bg-gradient-to-b from-[#f9fbff] to-[#eef3ff]',
      ].join(' ')}
    >
      {/* Header */}
      <div className="mb-3.5 border-b border-[#d8e4fb] pb-3">
        <h3 className="truncate text-[1.05rem] font-semibold leading-6 tracking-[0.01em] text-[#0f2a52]">{columnLabel}</h3>
        <div className="mt-1.5 inline-flex items-center rounded-full border border-[#c9dbfb] bg-white/85 px-2.5 py-1 text-[0.78rem] font-medium leading-5 text-[#3f5f89]">
          {countLabel}
        </div>
      </div>

      {/* Lista de tarjetas */}
      <div className="min-h-[240px] flex-1 space-y-3">
        {postulaciones.length === 0 ? (
          <div className="flex h-full min-h-[184px] flex-col items-center justify-center rounded-xl border border-dashed border-[#c9dbfb] bg-white/70 px-4 text-center text-[0.92rem] text-[#8ca1bf]">
            <Inbox size={18} className="mb-2 text-[#8ca1bf]" />
            <p className="font-medium leading-6">Sin postulaciones</p>
            <p className="mt-1 text-[0.8rem] leading-5 text-[#9aa9c0]">Las nuevas postulaciones aparecerán aquí</p>
          </div>
        ) : (
          <div className="max-h-[62vh] space-y-3 overflow-y-auto pr-1">
            {postulaciones.map((post) => (
              <KanbanCard
                key={post.id}
                postulacion={post}
                columnId={columnId}
                onTipificar={isTerminalColumn ? undefined : onTipificar}
                onDetails={onDetails}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
