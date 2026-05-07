export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  type: string;
  username: string;
  empleadoId: number;
  nombreCompleto: string;
  roles: string[];
};

export type { CurrentUser } from '@entities/auth/model';
export type { LoginFormData } from './login.model';
