/**
 * Tipos fijos e interfaces comunes utilizadas en la aplicación
 */

export type Role =
  | 'ADMINISTRADOR'
  | 'DESARROLLADOR'
  | 'LOGIN'
  | 'RRHH'
  | 'RECLUTAMIENTO'
  | 'CAPACITACION'
  | 'CONTABILIDAD'
  | 'COMMUNITY'
  | 'SUPERVISOR_VENTAS'
  | 'ASESOR_VENTAS'
  | 'SUPERVISOR_BACKOFFICE'
  | 'ASESOR_BACKOFFICE'
  | 'SUPERVISOR_GTR'
  | 'ASESOR_GTR'
  | 'SUPERVISOR_POSTVENTA'
  | 'ASESOR_POSTVENTA';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: string[];
}

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
