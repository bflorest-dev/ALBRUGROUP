/**
 * Constantes de la aplicación
 */

export const EMPLOYEE_STATUS_COLORS: Record<string, string> = {
  'DE LICENCIA': '#D97706',
  CAPACITACIÓN: '#0891B2',
};

export const EMPLOYEE_STATUS_BG_COLORS: Record<string, string> = {
  'DE LICENCIA': '#FFFBEB',
  CAPACITACIÓN: '#F0F9FF',
};

export const ROLES_LIST = [
  'Desarrollador',
  'Contador',
  'Capacitador',
  'Community',
  'Supervisor de Ventas',
  'Asesor de Ventas',
  'Supervisor Backoffice',
  'Asesor Backoffice',
  'Supervisor GTR',
  'Asesor GTR',
  'Supervisor Postventa',
  'Asesor Postventa',
];

// puestos que requieren seleccionar compañía
export const POSITIONS_WITH_COMPANY: string[] = [
  'CAPACITACION',
  'RECLUTAMIENTO',
  'COMMUNITY',
  'SUPERVISOR_VENTAS',
  'ASESOR_VENTAS',
  'SUPERVISOR_BACKOFFICE',
  'ASESOR_BACKOFFICE',
  'SUPERVISOR_GTR',
  'ASESOR_GTR',
  'SUPERVISOR_POSTVENTA',
  'ASESOR_POSTVENTA',
];
