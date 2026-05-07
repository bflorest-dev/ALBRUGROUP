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
    console.log('[KanbanBoard] Creando columnas desde catálogo:', tipificaciones);
    
    const dinamicas = [...tipificaciones]
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      .map((tip) => {
        const columna = {
          id: String(tip.codigo ?? '').trim().toUpperCase(),
          label: String(tip.codigo ?? '').trim().toUpperCase(),
          codigo: String(tip.codigo ?? '').trim().toUpperCase(),
          tipificacionId: Number(tip.id),
        };
        console.log('[KanbanBoard] Columna creada:', columna, 'desde tipificación:', tip);
        return columna;
      })
      .filter((tip) => {
        // Solo excluir si NO tiene ID o si es específicamente "RECLUTADO"
        const shouldExclude = !tip.id || tip.codigo === 'RECLUTADO';
        if (shouldExclude) {
          console.log('[KanbanBoard] ❌ Columna excluida:', tip, 'razón:', !tip.id ? 'sin ID' : 'es RECLUTADO');
        }
        return !shouldExclude;
      });

    const resultado = [
      { id: DEFAULT_COLUMN_ID, label: 'SIN CLASIFICAR', codigo: DEFAULT_COLUMN_ID },
      ...dinamicas,
    ];
    
    console.log('[KanbanBoard] ✅ Columnas finales creadas:', resultado.map(c => ({ id: c.id, tipificacionId: c.tipificacionId })));
    return resultado;
  }, [tipificaciones]);

  // Agrupar postulaciones por tipificacion_id (o código tipificación como fallback).
  const postulacionesPorColumna = useMemo(() => {
    console.log('[KanbanBoard] Agrupando postulaciones:', postulaciones);
    console.log('[KanbanBoard] Columnas disponibles:', columnas);
    
    const grupos: Record<string, PostulacionResponse[]> = {};

    // Inicializar grupos con columnas existentes
    columnas.forEach((col) => {
      grupos[col.id] = [];
    });

    postulaciones.forEach((post) => {
      // EXTRAER tipificacionId de múltiples formas posibles
      const tipificacionId =
        post.tipificacion?.id ??
        post.idTipificacion ??
        (post as any).tipificacionId ??
        (post as any).tipificacion_id ??
        null;

      const codigoTipificacion =
        post.tipificacion?.codigo ??
        post.codigoTipificacion ??
        (post as any).codigo_tipificacion ??
        '';

      console.log('[KanbanBoard] Procesando postulación:', {
        id: post.id,
        nombre: `${post.postulante.nombres} ${post.postulante.apellidos}`,
        tipificacionId,
        codigoTipificacion,
        post_tipificacion: post.tipificacion,
        post_idTipificacion: post.idTipificacion,
        post_codigoTipificacion: post.codigoTipificacion,
      });

      let targetKey = DEFAULT_COLUMN_ID;
      let matchMethod = 'default';

      // ESTRATEGIA 1: Buscar por ID de tipificación (más confiable)
      if (tipificacionId !== null && typeof tipificacionId === 'number') {
        const columnaEncontrada = columnas.find(
          (col) => col.tipificacionId === tipificacionId
        );
        if (columnaEncontrada) {
          targetKey = columnaEncontrada.id;
          matchMethod = 'tipificacionId';
          console.log('[KanbanBoard] ✅ Columna encontrada por ID:', { tipificacionId, targetKey, columna: columnaEncontrada });
        } else {
          console.warn('[KanbanBoard] ⚠️ No se encontró columna para tipificacionId:', tipificacionId, 'Columnas:', columnas.map(c => ({ id: c.id, tipificacionId: c.tipificacionId })));
        }
      }

      // ESTRATEGIA 2: Buscar por código exacto (normalizado)
      if (targetKey === DEFAULT_COLUMN_ID && codigoTipificacion) {
        const codigoNormalizado = String(codigoTipificacion)
          .trim()
          .toUpperCase()
          .replace(/\s+/g, '_');
        
        console.log('[KanbanBoard] Buscando por código normalizado:', codigoNormalizado);
        
        const columnaPorCodigo = columnas.find(
          (col) => col.codigo?.toUpperCase() === codigoNormalizado
        );
        if (columnaPorCodigo) {
          targetKey = columnaPorCodigo.id;
          matchMethod = 'codigoExacto';
          console.log('[KanbanBoard] ✅ Columna encontrada por código exacto:', { codigoNormalizado, targetKey, columna: columnaPorCodigo });
        } else {
          console.warn('[KanbanBoard] ⚠️ No se encontró columna para código exacto:', codigoNormalizado);
        }
      }

      // ESTRATEGIA 3: Buscar por código parcial (contiene)
      if (targetKey === DEFAULT_COLUMN_ID && codigoTipificacion) {
        const codigoNormalizado = String(codigoTipificacion)
          .trim()
          .toUpperCase()
          .replace(/\s+/g, '_');
        
        const columnaPorCodigoParcial = columnas.find(
          (col) => {
            const colCodigo = col.codigo?.toUpperCase() || '';
            return colCodigo.includes(codigoNormalizado) || codigoNormalizado.includes(colCodigo);
          }
        );
        if (columnaPorCodigoParcial) {
          targetKey = columnaPorCodigoParcial.id;
          matchMethod = 'codigoParcial';
          console.log('[KanbanBoard] ✅ Columna encontrada por código parcial:', { codigoNormalizado, targetKey, columna: columnaPorCodigoParcial });
        }
      }

      // ESTRATEGIA 4: Buscar por estadoBandeja (último recurso)
      if (targetKey === DEFAULT_COLUMN_ID && post.estadoBandeja) {
        const estadoNormalizado = String(post.estadoBandeja)
          .trim()
          .toUpperCase()
          .replace(/\s+/g, '_');
        
        const columnaPorEstado = columnas.find(
          (col) => col.id === estadoNormalizado || col.codigo === estadoNormalizado
        );
        if (columnaPorEstado) {
          targetKey = columnaPorEstado.id;
          matchMethod = 'estadoBandeja';
          console.log('[KanbanBoard] ✅ Columna encontrada por estadoBandeja:', { estadoNormalizado, targetKey, columna: columnaPorEstado });
        }
      }

      console.log('[KanbanBoard] 📍 Asignando postulación', post.id, 'a columna:', targetKey, 'método:', matchMethod);

      // Asignar al grupo correspondiente
      if (!grupos[targetKey]) {
        grupos[targetKey] = [];
      }
      grupos[targetKey]!.push(post);

    });

    console.log('[KanbanBoard] 📊 Grupos finales:', Object.entries(grupos).map(([key, posts]) => ({ columna: key, cantidad: posts.length, postulaciones: posts.map(p => ({ id: p.id, nombre: `${p.postulante.nombres} ${p.postulante.apellidos}` })) })));
    return grupos;
  }, [postulaciones, columnas]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-[#dbe7ff] bg-gradient-to-b from-white to-[#f8fbff]">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#dbe7ff] bg-gradient-to-b from-white to-[#f8fbff] p-3 pb-4">
      <div className="mb-2 flex items-center justify-between px-0.5">
        <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#5f7598]">Flujo de postulación</p>
        <p className="text-xs text-[#7a90b1]">Desliza horizontalmente para ver todas las columnas</p>
      </div>

      <div className="flex min-w-fit gap-4">
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
