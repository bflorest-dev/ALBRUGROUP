export interface UserSession {
  username: string;
  empleadoId?: number;
  nombreCompleto?: string;
  fechaIngresoEmpleado?: string | null;
  equipos?: number[];
  roles: string[];
  primaryRole: string | null;
  activeRole?: string | null;
  homeRoute: string;
}
