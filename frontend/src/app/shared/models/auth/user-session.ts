export interface UserSession {
  username: string;
  empleadoId?: number;
  nombreCompleto?: string;
  roles: string[];
  primaryRole: string | null;
  activeRole?: string | null;
  homeRoute: string;
}
