/**
 * Auth Repository
 * Llamadas HTTP para autenticación
 * 
 * FSD Layer: entities/auth/api
 */

import { authHttp } from '@shared/api/clienteHttp';

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

export class AuthRepository {
  /**
   * POST /autorizacion/login
   */
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await authHttp.post<LoginResponse>('/autorizacion/login', credentials);
    return response.data;
  }
}
