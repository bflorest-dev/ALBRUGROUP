/**
 * useAsesoresVentasConectados - Hook para obtener lista de asesores de ventas conectados
 * 
 * Consume: GET /presence/connected-users?role=ASESOR_VENTAS
 * 
 * Retorna:
 * - Lista de asesores con rol ASESOR_VENTAS que están conectados
 * - Formateada para usar en selects/combos: { id, nombre }
 */

import { useQuery } from '@tanstack/react-query';
import { PresenceRepository, type ConnectedUser } from '@shared/api';

/**
 * Formatea ConnectedUser a formato select
 */
function formatToAsesor(user: ConnectedUser) {
  return {
    id: user.empleadoId,
    nombre: user.nombreCompleto,
  };
}

export function useAsesoresVentasConectados() {
  return useQuery({
    queryKey: ['asesores-ventas-conectados'],
    queryFn: async () => {
      // 1. Prioridad a ASESOR_VENTAS (destinatarios típicos de reasignaciones)
      let usuarios = await PresenceRepository.getConnectedUsers('ASESOR_VENTAS');
      if (!usuarios || usuarios.length === 0) {
        // 2. Fallback a ASESOR_GTR si no hay asesores de ventas online,
        //    en algunos entornos de prueba/QA se usa este rol
        usuarios = await PresenceRepository.getConnectedUsers('ASESOR_GTR');
      }
      const mapped = usuarios.map(formatToAsesor);

      // Asegurar unicidad por id
      const unique = new Map(mapped.map((a) => [a.id, a]));
      return Array.from(unique.values());
    },
    staleTime: 10 * 1000,
    refetchInterval: 30 * 1000,
  });
}

/**
 * useAsesoresConectados - Hook genérico para obtener asesores por rol
 * 
 * @param role - Rol a filtrar (ej. "ASESOR_VENTAS", "ASESOR_GTR")
 */
export function useAsesoresConectados(role?: string) {
  return useQuery({
    queryKey: ['asesores-conectados', role],
    queryFn: async () => {
      if (!role) return [];
      const usuarios = await PresenceRepository.getConnectedUsers(role);
      return usuarios.map(formatToAsesor);
    },
    enabled: !!role,
    staleTime: 10 * 1000,
    refetchInterval: 30 * 1000,
  });
}
