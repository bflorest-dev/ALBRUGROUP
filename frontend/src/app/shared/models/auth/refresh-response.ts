export interface RefreshResponse {
  token: string;
  refreshToken: string;
  type: string;
  expiresIn: number;
  rolesAsignados: string[];
  rolPrincipal: string;
  rolActivo: string;
}
