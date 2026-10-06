export interface RefreshResponse {
  token: string;
  refreshToken: string;
  type: string;
  expiresIn: number;
  fechaIngresoEmpleado: string | null;
  rolesAsignados: string[];
  rolPrincipal: string;
  rolActivo: string;
}
