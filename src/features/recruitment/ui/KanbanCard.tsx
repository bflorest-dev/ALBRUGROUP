/**
 * @molecule KanbanCard — Tarjeta individual del Kanban
 * Representa una postulación en el tablero
 * Cambio de estado únicamente mediante botón Tipificar
 */

import React from 'react';
import { Phone, User, FileText } from 'lucide-react';
import type { PostulacionResponse } from '@features/hr/applications/model';
import styles from './KanbanCard.module.css';

interface KanbanCardProps {
  postulacion: PostulacionResponse;
  columnId: string;
  onTipificar?: (postulacion: PostulacionResponse, columnId: string) => void;
  onDetails?: (postulacion: PostulacionResponse) => void;
}

type LegacyPostulacionFields = PostulacionResponse & {
  etapa?: string;
  etapa_proceso?: string;
  estado?: string;
  estado_bandeja?: string;
};

export const KanbanCard: React.FC<KanbanCardProps> = ({
  postulacion,
  columnId,
  onTipificar,
  onDetails,
}) => {
  const normalizedPostulacion = postulacion as LegacyPostulacionFields;
  const nombreCompleto = `${postulacion.postulante.nombres} ${postulacion.postulante.apellidos}`;
  const etapa = String(
    postulacion.etapaProceso ??
      normalizedPostulacion.etapa ??
      normalizedPostulacion.etapa_proceso ??
      'SIN_ETAPA'
  ).trim() || 'SIN_ETAPA';
  const estado = String(
    postulacion.estadoProceso ??
      normalizedPostulacion.estado ??
      postulacion.estadoBandeja ??
      normalizedPostulacion.estado_bandeja ??
      'SIN_ESTADO'
  ).trim() || 'SIN_ESTADO';

  return (
    <div className={styles.card}>
      {/* Header: Nombre + Documento */}
      <div className={styles.header}>
        <p className={styles.name}>
          {nombreCompleto}
        </p>
        <p className={styles.document}>
          {postulacion.postulante.tipoDocumento}: {postulacion.postulante.documento}
        </p>
      </div>

      {/* Info: Celular + Oferta */}
      <div className={styles.infoList}>
        {postulacion.postulante.celular && (
          <div className={styles.infoRow}>
            <Phone size={14} />
            <span>{postulacion.postulante.celular}</span>
          </div>
        )}
        {postulacion.ofertaLaboral && (
          <div className={styles.infoRow}>
            <FileText size={14} />
            <span className={styles.offerCode}>{postulacion.ofertaLaboral.codigo}</span>
          </div>
        )}
      </div>

      {/* Origen Badge */}
      {postulacion.origen && (
        <div className={styles.originWrap}>
          <span className={styles.originBadge}>
            {postulacion.origen}
          </span>
        </div>
      )}

      <div className={styles.metaInfo}>
        <p className={styles.metaRow}>
          <span className={styles.metaLabel}>Etapa:</span> {etapa}
        </p>
        <p className={styles.metaRow}>
          <span className={styles.metaLabel}>Estado:</span> {estado}
        </p>
      </div>

      {/* Acciones */}
      {(onTipificar || onDetails) && (
        <div className={styles.actions}>
          {onTipificar && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTipificar(postulacion, columnId);
              }}
              className={`${styles.actionButton} ${styles.actionPrimary}`}
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
              className={`${styles.actionButton} ${styles.actionSecondary}`}
            >
              <User size={14} className={styles.actionIcon} />
              Ver más
            </button>
          )}
        </div>
      )}
    </div>
  );
};
