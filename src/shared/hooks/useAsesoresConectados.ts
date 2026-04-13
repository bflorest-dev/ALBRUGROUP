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

function isAsesorVentas(user: ConnectedUser): boolean {
  const puesto = String(user.puestoTrabajo ?? '').toUpperCase();
  const roles = Array.isArray(user.roles) ? user.roles.map((r) => String(r).toUpperCase()) : [];

  return (
    puesto === 'ASESOR_VENTAS' ||
    roles.includes('ASESOR_VENTAS') ||
    roles.includes('ASESOR_DE_VENTAS')
  );
}

function isOnline(user: ConnectedUser): boolean {
  const status = String(user.status ?? '').toUpperCase();
  const conectado = user.conectado;

  if (typeof conectado === 'boolean') {
    return conectado;
  }

  return (
    status === 'ONLINE' ||
    status === 'CONECTADO' ||
    status === 'ACTIVO'
  );
}

function isDisponible(user: ConnectedUser): boolean {
  return String(user.disponibilidad ?? '').toUpperCase() === 'DISPONIBLE';
}

/**
 * Formatea ConnectedUser a formato select, filtrando por disponibilidad
 */
function formatToAsesor(user: ConnectedUser) {
  return {
    id: user.empleadoId,
    nombre: user.nombreCompleto,
  };
}

/**
 * Filtra usarios por disponibilidad = DISPONIBLE
 */
function filterDisponibles(users: ConnectedUser[]): ConnectedUser[] {
  return users.filter((u) => isOnline(u) && isDisponible(u));
}

function filterAsesoresVentasDisponibles(users: ConnectedUser[]): ConnectedUser[] {
  return users.filter(
    (u) =>
      isAsesorVentas(u) &&
      isOnline(u) &&
      isDisponible(u)
  );
}

export function useAsesoresVentasConectados() {
  return useQuery({
    queryKey: ['asesores-ventas-conectados'],
    queryFn: async () => {
      // Solo obtener ASESOR_VENTAS que estén conectados
      const usuarios = await PresenceRepository.getConnectedUsers('ASESOR_VENTAS');
      
      // Filtrar solo los disponibles (excluir OCUPADO, GESTIONANDO, SATURADO)
      const disponibles = filterAsesoresVentasDisponibles(usuarios);
      
      const mapped = disponibles.map(formatToAsesor);

      // Asegurar unicidad por id
      const unique = new Map(mapped.map((a) => [a.id, a]));
      return Array.from(unique.values());
    },
    staleTime: 5 * 1000,
    refetchInterval: 5 * 1000,
    refetchOnWindowFocus: true,
  });
}

/**
 * useAsesoresConectados - Hook genérico para obtener asesores por rol, filtrando disponibles
 * 
 * @param role - Rol a filtrar (ej. "ASESOR_VENTAS", "ASESOR_GTR")
 * @returns Asesores conectados con disponibilidad = DISPONIBLE
 */
export function useAsesoresConectados(role?: string) {
  return useQuery({
    queryKey: ['asesores-conectados', role],
    queryFn: async () => {
      if (!role) return [];
      const usuarios = await PresenceRepository.getConnectedUsers(role);
      // Filtrar solo los disponibles
      const disponibles = filterDisponibles(usuarios);
      return disponibles.map(formatToAsesor);
    },
    enabled: !!role,
    staleTime: 10 * 1000,
    refetchInterval: 10 * 1000,
    refetchOnWindowFocus: true,
  });
}
