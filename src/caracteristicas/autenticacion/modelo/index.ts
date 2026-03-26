export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  username: string;
  empleadoId: number;
  nombreCompleto: string;
  roles: string[];
}

export interface CurrentUser {
  username: string;
  empleadoId: number;
  nombreCompleto: string;
  roles: string[];
}

export interface LoginFormData {
  username: string;
  password: string;
}
