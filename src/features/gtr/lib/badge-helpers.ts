/**
 * Helpers para mapear tipos de evento GTR a variantes de Badge
 * Separa la lógica de dominio de los componentes de UI
 */

import type { BadgeProps } from '@shared/ui/badge';

/**
 * Mapea tipos de evento GTR a variantes de Badge del Design System
 */
export function getEventBadgeVariant(eventType: string): BadgeProps['variant'] {
  const eventTypeMap: Record<string, BadgeProps['variant']> = {
    CONTACTO: 'info',
    TIPIFICACION: 'secondary', 
    VALIDACION: 'success',
    CAMBIO_ETAPA: 'warning',
    ASIGNACION: 'info',
    REASIGNACION: 'secondary',
    ERROR: 'error',
  };
  
  return eventTypeMap[eventType] || 'default';
}

/**
 * Obtiene el color específico para eventos GTR cuando se necesite más control
 * Usar solo cuando las variantes estándar no sean suficientes
 */
export function getEventBadgeColor(eventType: string): string {
  const colorMap: Record<string, string> = {
    CONTACTO: 'bg-blue-100 text-blue-800',
    TIPIFICACION: 'bg-purple-100 text-purple-800',
    VALIDACION: 'bg-green-100 text-green-800',
    CAMBIO_ETAPA: 'bg-orange-100 text-orange-800',
    ASIGNACION: 'bg-indigo-100 text-indigo-800',
    REASIGNACION: 'bg-pink-100 text-pink-800',
    ERROR: 'bg-red-100 text-red-800',
  };
  
  return colorMap[eventType] || 'bg-gray-100 text-gray-800';
}