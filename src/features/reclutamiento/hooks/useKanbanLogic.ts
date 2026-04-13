/**
 * useKanbanLogic — Hook para lógica del Kanban
 * Maneja actualizaciones de postulaciones al mover entre columnas
 */

import { useCallback } from 'react';
import * as postulacionesApi from '@features/rrhh/postulaciones/api/postulacionesApi';
import type { TipificarPostulacionRequest } from '@features/rrhh/postulaciones/model';

interface UseKanbanLogicProps {
  tipificaciones: any[];
  onSuccess?: () => void;
}

/**
 * Hook que maneja la lógica de actualizar una postulación
 * cuando se mueve entre columnas del kanban
 */
export function useKanbanLogic({ tipificaciones, onSuccess }: UseKanbanLogicProps) {
  // Mapear codigo de tipificacion -> idTipificacion
  const mapCodigo2Id = useCallback(
    (codigo: string) => {
      const tip = tipificaciones.find((t) => t.codigo === codigo);
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
      const tipificacion = tipificaciones.find((t) => t.id === idTipificacion);
      const idSubtipificacion =
        tipificacion?.subtipificaciones?.[0]?.id ?? idTipificacion;

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
