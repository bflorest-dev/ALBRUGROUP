/**
 * ENUMERACIONES CENTRALIZADAS
 * 
 * Definición única de todas las enumeraciones utilizadas en la aplicación.
 * Esto evita duplicación y asegura consistencia en toda la codebase.
 * 
 * Punto #8: Consistency - Estandarización de valores constantes
 */

/**
 * Canales de comunicación para leads
 * Valores permitidos cuando se crea o filtra un lead
 */
export type LeadChannel = 'Facebook' | 'Instagram' | 'WhatsApp';
export const LeadChannelValues = ['Facebook', 'Instagram', 'WhatsApp'] as const;

/**
 * Estados de seguimiento de un lead
 * Representa el estado actual del lead en el pipeline de ventas
 */
export type LeadFollowUpStatus = 'Nuevo' | 'En gestión' | 'Gestionado' | 'Asignado';
export const LeadFollowUpStatusValues = ['Nuevo', 'En gestión', 'Gestionado', 'Asignado'] as const;

/**
 * Tipificación de leads - Categorías de resultado de contacto
 * Basado en el resultado del primer contacto/interacción
 * Formato: "número - DESCRIPCIÓN"
 */
export type LeadTipification = 
  | 'Sin tipificar'
  | '0 - SIN CONTACTO'
  | '1 - SEGUIMIENTO'
  | '2 - AGENDADOS'
  | '3 - RECHAZADO'
  | '4 - PREVENTA INCOMPLETA'
  | '5 - PREVENTA'
  | '6 - PDTE SCORE/PREVENTA'
  | '7 - PREVENTA COMPLETA'
  | '8 - LISTA NEGRA';

export const LeadTipificationValues = [
  'Sin tipificar',
  '0 - SIN CONTACTO',
  '1 - SEGUIMIENTO',
  '2 - AGENDADOS',
  '3 - RECHAZADO',
  '4 - PREVENTA INCOMPLETA',
  '5 - PREVENTA',
  '6 - PDTE SCORE/PREVENTA',
  '7 - PREVENTA COMPLETA',
  '8 - LISTA NEGRA',
] as const;

/**
 * Estados de disponibilidad de un asesor
 * Utilizado para mostrar carga de trabajo visual
 */
export type AdvisorStatus = 'Disponible' | 'Ocupado' | 'Saturado';
export const AdvisorStatusValues = ['Disponible', 'Ocupado', 'Saturado'] as const;

/**
 * Paises/Puntos de Origen y Interés de Servicio (POIS)
 * Determina validaciones de teléfono y configuración regional
 */
export type POISCountry = 'CO' | 'MX' | 'PE';
export const POISCountryValues = ['CO', 'MX', 'PE'] as const;

/**
 * Regiones/Áreas de los asesores
 * Define zonas geográficas de cobertura
 */
export type AdvisorArea = 'Norte' | 'Sur' | 'Centro' | 'Este' | 'Oeste';
export const AdvisorAreaValues = ['Norte', 'Sur', 'Centro', 'Este', 'Oeste'] as const;

/**
 * Estado de error - Categorías de errores para mostrar al usuario
 * Utilizado por SafeErrorHandling para mapear errores internos a mensajes seguros
 */
export type ErrorCategory = 
  | 'ERROR_DESCONOCIDO'
  | 'ERROR_RED'
  | 'TIMEOUT'
  | 'ENTRADA_INVALIDA'
  | 'CAMPO_REQUERIDO'
  | 'NO_AUTORIZADO'
  | 'ACCESO_DENEGADO'
  | 'NO_ENCONTRADO'
  | 'ERROR_SERVIDOR';

/**
 * Unidades de Negocio (Business Units)
 * Líneas de negocio a las que pertenecen los leads
 */
export type BusinessUnit = 'Telefonía Hogar' | 'Internet Empresas' | 'Móviles' | 'Cable';
export const BusinessUnitValues = ['Telefonía Hogar', 'Internet Empresas', 'Móviles', 'Cable'] as const;

/**
 * Colores por canal para UI
 * Mapeo de enum a color hex para mantener consistencia visual
 */
export const CHANNEL_COLOR_MAP: Record<LeadChannel, string> = {
  'Facebook': '#3B82F6',    // Azul
  'Instagram': '#EC4899',   // Rosa
  'WhatsApp': '#10B981',    // Verde
};

/**
 * Colores por estado de asesor para UI
 * Mapeo de enum a color hex para barras de progreso
 */
export const ADVISOR_STATUS_COLOR_MAP: Record<AdvisorStatus, string> = {
  'Disponible': '#10B981',   // Verde
  'Ocupado': '#F59E0B',      // Ámbar
  'Saturado': '#EF4444',     // Rojo
};

/**
 * Colores por tipificación para UI
 * Mapeo de categoría tipificación a color hex para badges
 */
export const TIPIFICATION_COLOR_MAP: Record<string, string> = {
  'Sin tipificar': '#FFA500',                              // Naranja
  '0 - SIN CONTACTO': '#6B7280',                           // Gris
  '1 - SEGUIMIENTO': '#3B82F6',                            // Azul
  '2 - AGENDADOS': '#8B5CF6',                              // Púrpura
  '3 - RECHAZADO': '#EF4444',                              // Rojo
  '4 - PREVENTA INCOMPLETA': '#F59E0B',                    // Ámbar
  '5 - PREVENTA': '#10B981',                               // Verde
  '6 - PDTE SCORE/PREVENTA': '#EC4899',                    // Rosa
  '7 - PREVENTA COMPLETA': '#10B981',                      // Verde oscuro
  '8 - LISTA NEGRA': '#1F2937',                            // Gris oscuro
};

/**
 * Estados de disponibilidad para UI - Colores de fondo
 */
export const ADVISOR_STATUS_BG_MAP: Record<AdvisorStatus, string> = {
  'Disponible': '#D1FAE5',   // Verde claro
  'Ocupado': '#FEF3C7',      // Ámbar claro
  'Saturado': '#FEE2E2',     // Rojo claro
};

/**
 * Conversión de tipo unión a strings para dropdowns
 * Utilizado en formularios para populates select fields
 */
export const getEnumValues = <T extends readonly string[]>(values: T): string[] => {
  return Array.from(values);
};

/**
 * Obtener label amigable de un tipo
 * Convierte 'FACEBOOK' a 'Facebook', 'DISPONIBLE' a 'Disponible'
 */
export const getEnumLabel = (value: string): string => {
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

