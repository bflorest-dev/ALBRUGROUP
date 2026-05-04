/**
 * @molecule KanbanColumn — Columna del Kanban
 * Agrupa postulaciones por estado/tipificación
 * Renderiza tarjetas sin drag-and-drop
 */

import React from 'react';
import { Inbox } from 'lucide-react';
import { KanbanCard } from './KanbanCard';
import type { PostulacionResponse } from '@features/hr/applications/model';
import styles from './KanbanColumn.module.css';

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
  const displayLabel = columnLabel.replace(/_/g, ' ');
  const columnClassName = isTerminalColumn
    ? `${styles.column} ${styles.terminalColumn}`
    : styles.column;

  return (
    <div className={columnClassName}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>{displayLabel}</h3>
        <div className={styles.countBadge}>
          {countLabel}
        </div>
      </div>

      {/* Lista de tarjetas */}
      <div className={styles.listArea}>
        {postulaciones.length === 0 ? (
          <div className={styles.emptyState}>
            <Inbox size={18} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>Sin postulaciones</p>
            <p className={styles.emptyText}>Las nuevas postulaciones aparecerán aquí</p>
          </div>
        ) : (
          <div className={styles.cardsList}>
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
