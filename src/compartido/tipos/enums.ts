/**
 * Definiciones de enumeraciones del sistema
 */

export type LeadChannel = 'Facebook' | 'Instagram' | 'WhatsApp';
export const LeadChannelValues = ['Facebook', 'Instagram', 'WhatsApp'] as const;

export type LeadFollowUpStatus = 'Nuevo' | 'En gestión' | 'Gestionado' | 'Asignado';
export const LeadFollowUpStatusValues = ['Nuevo', 'En gestión', 'Gestionado', 'Asignado'] as const;

export type LeadTipification =
  | 'Sin tipificar'
  | 'Tipificación 0'
  | 'Tipificación 1'
  | 'Tipificación 2'
  | 'Tipificación 3'
  | 'Tipificación 4'
  | 'Tipificación 5'
  | 'Tipificación 6'
  | 'Tipificación 7';

export const LeadTipificationValues = [
  'Sin tipificar',
  'Tipificación 0',
  'Tipificación 1',
  'Tipificación 2',
  'Tipificación 3',
  'Tipificación 4',
  'Tipificación 5',
  'Tipificación 6',
  'Tipificación 7',
] as const;

export const LeadTipificationCosts: Record<LeadTipification, number> = {
  'Sin tipificar': 0,
  'Tipificación 0': 100,
  'Tipificación 1': 150,
  'Tipificación 2': 200,
  'Tipificación 3': 250,
  'Tipificación 4': 300,
  'Tipificación 5': 350,
  'Tipificación 6': 400,
  'Tipificación 7': 450,
};

export type AdvisorStatus = 'Disponible' | 'Ocupado' | 'Saturado';
export const AdvisorStatusValues = ['Disponible', 'Ocupado', 'Saturado'] as const;

export type POISCountry = 'CO' | 'MX' | 'PE';
export const POISCountryValues = ['CO', 'MX', 'PE'] as const;

export type AdvisorArea = 'Norte' | 'Sur' | 'Centro' | 'Este' | 'Oeste';
export const AdvisorAreaValues = ['Norte', 'Sur', 'Centro', 'Este', 'Oeste'] as const;

export type ErrorCategory =
  | 'Validación'
  | 'Red'
  | 'Autenticación'
  | 'Autorización'
  | 'Servidor'
  | 'Cliente'
  | 'Base de datos'
  | 'Desconocido'
  | 'Otro';

export const ErrorCategoryValues = [
  'Validación',
  'Red',
  'Autenticación',
  'Autorización',
  'Servidor',
  'Cliente',
  'Base de datos',
  'Desconocido',
  'Otro',
] as const;

export type BusinessUnit = 'Telefonía Hogar' | 'Internet Empresas' | 'Móviles' | 'Cable';
export const BusinessUnitValues = ['Telefonía Hogar', 'Internet Empresas', 'Móviles', 'Cable'] as const;
