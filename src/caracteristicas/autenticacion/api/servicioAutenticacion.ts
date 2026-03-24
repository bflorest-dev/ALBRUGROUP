/**
 * Servicio de Autenticación — Login y gestión de sesión JWT
 *
 * Usa authHttp (baseURL = /api/auth en dev) que el proxy Vite
 * reescribe a :8080 (sin prefijo /rrhh, es el gateway directo).
 *
 * Endpoint: POST /autorizacion/login
 */

import { authHttp, rrhhHttp } from '@compartido/api/clienteHttp';

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

const TOKEN_KEY = 'auth_token';
const USER_KEY  = 'auth_user';

export class AuthService {

  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    // POST /autorizacion/login  (va por /api/auth → proxy → :8080)
    const response = await authHttp.post<LoginResponse>('/autorizacion/login', credentials);
    const { token, type, username, empleadoId, nombreCompleto, roles } = response.data;

    // Persistir sesión
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify({ username, empleadoId, nombreCompleto, roles }));

    // Inyectar el token en rrhhHttp para que todas las llamadas
    // posteriores a /api/rrhh/* ya lleven el header Authorization
    rrhhHttp.defaults.headers.common['Authorization'] = `${type} ${token}`;

    return response.data;
  }

  static logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('selectedRole');
    delete rrhhHttp.defaults.headers.common['Authorization'];
  }

  static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  static getCurrentUser(): CurrentUser | null {
    const json = localStorage.getItem(USER_KEY);
    if (!json) return null;
    try {
      return JSON.parse(json) as CurrentUser;
    } catch {
      return null;
    }
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  static hasRole(role: string): boolean {
    return this.getCurrentUser()?.roles.includes(role) ?? false;
  }

  /**
   * Llamar al arrancar la app (en main.tsx o App.tsx)
   * Restaura el header Authorization si el usuario ya tenía sesión.
   */
  static initialize(): void {
    const token = this.getToken();
    if (token) {
      rrhhHttp.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
}
