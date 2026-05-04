/**
 * Mappers centralizados para Badge variants por dominio
 * Evita duplicación de lógica de mapeo en features
 */

import type { BadgeProps } from '@shared/ui/badge';

/**
 * Estados generales de aplicación
 */
export function getStatusBadgeVariant(status: string): BadgeProps['variant'] {
  const statusMap: Record<string, BadgeProps['variant']> = {
    ACTIVE: 'success',
    INACTIVE: 'secondary',
    PENDING: 'warning',
    ERROR: 'destructive',
    COMPLETED: 'success',
    CANCELLED: 'destructive',
  };
  
  return statusMap[status.toUpperCase()] || 'default';
}

/**
 * Estados de empleados
 */
export function getEmployeeStatusBadgeVariant(status: string): BadgeProps['variant'] {
  const employeeStatusMap: Record<string, BadgeProps['variant']> = {
    ACTIVO: 'success',
    INACTIVO: 'secondary',
    LISTA_NEGRA: 'destructive',
    PENDIENTE: 'warning',
  };
  
  return employeeStatusMap[status.toUpperCase()] || 'default';
}

/**
 * Estados de postulaciones
 */
export function getApplicationStatusBadgeVariant(status: string): BadgeProps['variant'] {
  const applicationStatusMap: Record<string, BadgeProps['variant']> = {
    NUEVO: 'info',
    EN_PROCESO: 'warning',
    APROBADO: 'success',
    RECHAZADO: 'destructive',
    CONTRATADO: 'success',
  };
  
  return applicationStatusMap[status.toUpperCase()] || 'default';
}