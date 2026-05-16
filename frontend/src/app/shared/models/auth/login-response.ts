export interface LoginResponse {
  token: string;
  refreshToken: string;
  type: string;
  expiresIn: number;
  username: string;
  empleadoId: number;
  nombreCompleto: string;
  roles: string[];
}
