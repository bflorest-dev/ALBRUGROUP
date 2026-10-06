export interface UserSession {
  username: string;
  empleadoId?: number;
  nombreCompleto?: string;
  fechaIngresoEmpleado?: string | null;
  roles: string[];
  primaryRole: string | null;
  activeRole?: string | null;
  homeRoute: string;
}
