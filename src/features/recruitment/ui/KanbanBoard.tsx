/**
 * @organism KanbanBoard — Tablero Kanban completo
 * Sin drag-and-drop: cambios solo por botón Tipificar
 * Integra con endpoints de postulaciones y tipificaciones
 */

import React, { useMemo, useState } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { PostulanteEventosModal } from './PostulanteEventosModal';
import { Spinner } from '@shared/ui';
import type { PostulacionResponse, TipificacionCatalogo } from '@features/hr/applications/model';
import styles from './KanbanBoard.module.css';

const DEFAULT_COLUMN_ID = 'SIN_CLASIFICAR';

interface KanbanColumnDefinition {
  id: string;
  label: string;
  codigo: string;
  tipificacionId?: number;
}

interface KanbanBoardProps {
  postulaciones: PostulacionResponse[];
  tipificaciones: TipificacionCatalogo[];
  loading?: boolean;
  onTipificar?: (postulacion: PostulacionResponse, columnId: string) => void;
  onDetails?: (postulacion: PostulacionResponse) => void;
  onUpdatePostulacion?: (id: number, estadoBandeja: string) => Promise<void>;
}

interface PostulacionCompatFields {
  tipificacionId?: number | null;
  tipificacion_id?: number | null;
  codigo_tipificacion?: string | null;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  postulaciones,
  tipificaciones,
  loading = false,
  onTipificar,
  onDetails,
  onUpdatePostulacion,
}) => {
  void onUpdatePostulacion;
  const [detallePostulacion, setDetallePostulacion] =
    useState<PostulacionResponse | null>(null);

  // Columnas del Kanban basadas en catálogo de tipificaciones + SIN CLASIFICAR.
  const columnas = useMemo<KanbanColumnDefinition[]>(() => {
    const dinamicas = [...tipificaciones]
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      .map((tip) => ({
        id: String(tip.codigo ?? '').trim().toUpperCase(),
        label: String(tip.codigo ?? '').trim().toUpperCase(),
        codigo: String(tip.codigo ?? '').trim().toUpperCase(),
        tipificacionId: Number(tip.id),
      }))
      .filter((tip) => tip.id && tip.codigo !== 'RECLUTADO');

    return [
      { id: DEFAULT_COLUMN_ID, label: 'SIN CLASIFICAR', codigo: DEFAULT_COLUMN_ID },
      ...dinamicas,
    ];
  }, [tipificaciones]);

  // Agrupar postulaciones por tipificacion_id (o código tipificación como fallback).
  const postulacionesPorColumna = useMemo(() => {
    const grupos: Record<string, PostulacionResponse[]> = {};

    // Inicializar grupos con columnas existentes
    columnas.forEach((col) => {
      grupos[col.id] = [];
    });

    postulaciones.forEach((post) => {
      const postCompat = post as PostulacionResponse & PostulacionCompatFields;

      // EXTRAER tipificacionId de múltiples formas posibles
      const tipificacionId =
        post.tipificacion?.id ??
        post.idTipificacion ??
        postCompat.tipificacionId ??
        postCompat.tipificacion_id ??
        null;

      const codigoTipificacion =
        post.tipificacion?.codigo ??
        post.codigoTipificacion ??
        postCompat.codigo_tipificacion ??
        '';

      // Buscar columna por ID de tipificación
      let targetKey = DEFAULT_COLUMN_ID;

      if (tipificacionId !== null && typeof tipificacionId === 'number') {
        const columnaEncontrada = columnas.find(
          (col) => col.tipificacionId === tipificacionId
        );
        if (columnaEncontrada) {
          targetKey = columnaEncontrada.id;
        }
      }

      // Fallback: buscar por código
      if (targetKey === DEFAULT_COLUMN_ID && codigoTipificacion) {
        const codigoNormalizado = String(codigoTipificacion)
          .trim()
          .toUpperCase()
          .replace(/\s+/g, '_');
        const columnaPorCodigo = columnas.find(
          (col) => col.codigo?.toUpperCase() === codigoNormalizado
        );
        if (columnaPorCodigo) {
          targetKey = columnaPorCodigo.id;
        }
      }

      // Asignar al grupo correspondiente
      if (!grupos[targetKey]) {
        grupos[targetKey] = [];
      }
      grupos[targetKey]!.push(post);

    });

    return grupos;
  }, [postulaciones, columnas]);

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className={styles.board}>
      <div className={styles.boardHeader}>
        <p className={styles.boardEyebrow}>Flujo de postulación</p>
        <p className={styles.boardHint}>Desliza horizontalmente para ver todas las columnas</p>
      </div>

      <div className={styles.columnsRow}>
        {columnas.map((col) => (
          <KanbanColumn
            key={col.id}
            columnId={col.id}
            columnLabel={col.label}
            postulaciones={postulacionesPorColumna[col.id] || []}
            onTipificar={onTipificar}
            onDetails={(postulacion) => {
              onDetails?.(postulacion);
              setDetallePostulacion(postulacion);
            }}
          />
        ))}
      </div>

      {detallePostulacion && (
        <PostulanteEventosModal
          isOpen={!!detallePostulacion}
          onClose={() => setDetallePostulacion(null)}
          postulacionId={detallePostulacion.id}
          nombrePostulante={`${detallePostulacion.postulante.nombres} ${detallePostulacion.postulante.apellidos}`}
        />
      )}
    </div>
  );
};
