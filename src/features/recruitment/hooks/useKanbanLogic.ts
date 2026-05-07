/**
 * useKanbanLogic — Hook para lógica del Kanban
 * Maneja actualizaciones de postulaciones al mover entre columnas
 */

import { useCallback } from 'react';
import * as postulacionesApi from '@features/hr/applications/api/postulacionesApi';
import type { TipificarPostulacionRequest } from '@features/hr/applications/model';
import { isObject, hasProperty, isString, isNumber, isArray } from '@shared/lib/type-guards';

interface Tipificacion {
  id: number;
  codigo: string;
  subtipificaciones?: Array<{ id: number; codigo: string }>;
}

interface UseKanbanLogicProps {
  tipificaciones: Tipificacion[];
  onSuccess?: () => void;
}

/**
 * Type guard para validar tipificaciones
 */
function isTipificacion(value: unknown): value is Tipificacion {
  return (
    isObject(value) &&
    hasProperty(value, 'id') &&
    isNumber(value.id) &&
    hasProperty(value, 'codigo') &&
    isString(value.codigo)
  );
}

/**
 * Hook que maneja la lógica de actualizar una postulación
 * cuando se mueve entre columnas del kanban
 */
export function useKanbanLogic({ tipificaciones, onSuccess }: UseKanbanLogicProps) {
  // Mapear codigo de tipificacion -> idTipificacion
  const mapCodigo2Id = useCallback(
    (codigo: string): number | null => {
      const tip = tipificaciones.find((t) => isTipificacion(t) && t.codigo === codigo);
      return tip?.id ?? null;
    },
    [tipificaciones]
  );

  // Actualizar postulación cuando se mueve en kanban
  const updatePostulacionEstado = useCallback(
    async (idPostulacion: number, nuevoEstadoBandeja: string) => {
      const idTipificacion = mapCodigo2Id(nuevoEstadoBandeja);

      if (!idTipificacion) {
        throw new Error(`No se encontró tipificación para: ${nuevoEstadoBandeja}`);
      }

      // Por ahora, usar la primera subtipificación disponible
      // En el futuro, permitir que el usuario seleccione
      const tipificacion = tipificaciones.find((t) => isTipificacion(t) && t.id === idTipificacion);
      
      let idSubtipificacion = idTipificacion;
      if (tipificacion?.subtipificaciones && isArray(tipificacion.subtipificaciones)) {
        const firstSub = tipificacion.subtipificaciones[0];
        if (isObject(firstSub) && hasProperty(firstSub, 'id') && isNumber(firstSub.id)) {
          idSubtipificacion = firstSub.id;
        }
      }

      const body: TipificarPostulacionRequest = {
        idTipificacion,
        idSubtipificacion,
        modalidadContacto: 'NO_ESPECIFICADA',
        observacion: 'Movido en kanban',
      };

      await postulacionesApi.tipificarPostulacion(idPostulacion, body);

      onSuccess?.();
    },
    [mapCodigo2Id, tipificaciones, onSuccess]
  );

  return {
    updatePostulacionEstado,
  };
}

// Hook adicional para obtener API de postulaciones
export function usePostulacionesApi() {
  return postulacionesApi;
}
