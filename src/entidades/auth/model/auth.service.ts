/**
 * Auth Service
 * Lógica de autenticación y gestión de sesión JWT
 * 
 * FSD Layer: entities/auth/model
 */

import { rrhhHttp, leadsHttp } from '@shared/api/clienteHttp';
import { AuthRepository, type LoginRequest, type LoginResponse } from '../api/auth.repository';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export interface CurrentUser {
  username: string;
  empleadoId: number;
  nombreCompleto: string;
  roles: string[];
}

export class AuthService {
  /**
   * Inicializar sesión desde localStorage (si existe token válido)
   */
  static initialize(): void {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      const authHeader = `Bearer ${token}`;
      rrhhHttp.defaults.headers.common['Authorization'] = authHeader;
      leadsHttp.defaults.headers.common['Authorization'] = authHeader;
    }
  }

  /**
   * Login con credenciales
   */
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await AuthRepository.login(credentials);
    const { token, type, username, empleadoId, nombreCompleto, roles } = response;

    // Persistir sesión
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify({ username, empleadoId, nombreCompleto, roles }));
    localStorage.setItem('user', JSON.stringify({ id: String(empleadoId), name: nombreCompleto, roles }));

    // Inyectar token en headers
    const authHeader = `${type} ${token}`;
    rrhhHttp.defaults.headers.common['Authorization'] = authHeader;
    leadsHttp.defaults.headers.common['Authorization'] = authHeader;

    return response;
  }

  /**
   * Logout
   */
  static logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('user');
    delete rrhhHttp.defaults.headers.common['Authorization'];
    delete leadsHttp.defaults.headers.common['Authorization'];
  }

  /**
   * Obtener usuario actual
   */
  static getCurrentUser(): CurrentUser | null {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  /**
   * Verificar si hay token válido
   */
  static isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }
}
