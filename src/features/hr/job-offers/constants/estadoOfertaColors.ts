/**
 * Mapeo de estados de oferta laboral a clases de estilo Tailwind
 * Centraliza los colores para consistencia y reutilización
 * 
 * Estados soportados:
 *   - ACTIVO: verde (oferta abierta y recibiendo solicitudes)
 *   - CANCELADO: gris (oferta anulada)
 *   - CERRADO: naranja (oferta cerrada temporalmente)
 *   - COMPLETADO: azul (oferta completada/llena)
 */

export const ESTADO_OFERTA_COLORS: Record<string, string> = {
  ACTIVO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-gray-100 text-gray-800',
  CERRADO: 'bg-orange-100 text-orange-800',
  COMPLETADO: 'bg-blue-100 text-blue-800',
};
