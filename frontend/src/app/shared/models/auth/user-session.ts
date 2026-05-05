export interface UserSession {
  username: string;
  empleadoId?: number;
  nombreCompleto?: string;
  roles: string[];
  primaryRole: string | null;
  homeRoute: string;
}
