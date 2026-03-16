import type { User } from '../../shared/types';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  username: string;
  empleadoId: string;
  nombreCompleto: string;
  roles: string[];
}

// Tipo de usuario para mantener compatibilidad con el resto de la app
export interface LoginUser extends User {
  empleadoId?: string;
  roles?: string[];
}
