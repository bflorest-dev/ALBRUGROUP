export interface LoginResponse {
  token: string;
  refreshToken: string;
  type: string;
  expiresIn: number;
  username: string;
  empleadoId: number;
  nombreCompleto: string;
  fechaIngresoEmpleado: string | null;
  roles: string[];
  rolesAsignados: string[];
  rolPrincipal: string;
  rolActivo: string;
}
