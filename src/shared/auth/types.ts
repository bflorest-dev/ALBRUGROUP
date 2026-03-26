export type Role =
  | 'LOGIN'
  | 'ADMINISTRADOR'
  | 'RRHH'
  | 'RECLUTAMIENTO'
  | 'CAPACITACIÓN'
  | 'CAPACITACION'
  | 'CONTABILIDAD'
  | 'COMMUNITY'
  | 'GTR'
  | 'SUPERVISOR_VENTAS'
  | 'ASESOR_VENTAS'
  | 'SUPERVISOR_BACKOFFICE'
  | 'ASESOR_BACKOFFICE'
  | 'SUPERVISOR_GTR'
  | 'ASESOR_GTR'
  | 'SUPERVISOR_POSTVENTA'
  | 'ASESOR_POSTVENTA'
  | 'ASESOR_DE_VENTAS';

export type User = { id: string; name: string; roles: Role[] };
