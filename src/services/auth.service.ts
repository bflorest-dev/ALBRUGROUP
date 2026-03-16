/**
 * Authentication Service
 * Maneja login, logout y gestión de tokens JWT
 */

import { http } from '../api/http';

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
const USER_KEY = 'auth_user';
const CSRF_TOKEN_KEY = '_csrf';

export class AuthService {
  /**
   * Obtener CSRF token del servidor
   * Algunos servidores Spring Security requieren esto antes de login
   */
  private static async getCsrfToken(): Promise<string | null> {
    try {
      // Hacer un GET simple para que Spring Security establezca el CSRF token
      await http.get('/');
      // El token se almacena en cookie automáticamente
      return null; // Axios maneja cookies automáticamente
    } catch {
      // Si falla, continuamos sin CSRF token
      // Los endpoints públicos como /auth/login pueden no requerirlo
      return null;
    }
  }

  /**
   * Login - Obtener token JWT
   */
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('[AuthService.login] 🔐 Iniciando login...');
      console.log('[AuthService.login]   - Username:', credentials.username);
      console.log('[AuthService.login]   - Endpoint: POST /autorizacion/login');
      console.log('[AuthService.login]   - Target: Vite proxy /auth → http://localhost:8081');

      // Axios ya tiene baseURL: '/auth' (vía Vite proxy)
      // Solo enviar el endpoint relativo
      const response = await http.post<LoginResponse>('/autorizacion/login', credentials);
      const { token, type, username, empleadoId, nombreCompleto, roles } = response.data;

      console.log('[AuthService.login] ✅ LOGIN EXITOSO');
      console.log('[AuthService.login]   - Username:', username);
      console.log('[AuthService.login]   - Nombre:', nombreCompleto);
      console.log('[AuthService.login]   - Roles:', roles);
      console.log('[AuthService.login]   - Token:', token.substring(0, 20) + '...');

      // Guardar token en localStorage
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify({
        username,
        empleadoId,
        nombreCompleto,
        roles,
      }));

      // Actualizar header de Axios con el nuevo token
      http.defaults.headers.common['Authorization'] = `${type} ${token}`;

      return response.data;
    } catch (error) {
      console.error('[AuthService.login] ❌ ERROR en login');
      console.error('[AuthService.login]   - Status:', (error as any)?.response?.status);
      console.error('[AuthService.login]   - Data:', (error as any)?.response?.data);
      console.error('[AuthService.login]   - Message:', (error as any)?.message);
      console.error('[AuthService.login]   - Error completo:', error);
      throw error;
    }
  }

  /**
   * Logout - Limpiar token y datos de usuario
   */
  static logout(): void {
    console.log('[AuthService.logout] 🚪 Logging out...');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('selectedRole'); // Forzar volver a LOGIN
    delete http.defaults.headers.common['Authorization'];
    console.log('[AuthService.logout] ✅ Logout complete');
  }

  /**
   * Obtener token almacenado
   */
  static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Obtener usuario actual
   */
  static getCurrentUser(): CurrentUser | null {
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;

    try {
      return JSON.parse(userJson) as CurrentUser;
    } catch {
      return null;
    }
  }

  /**
   * Verificar si el usuario está autenticado
   */
  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  static hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.roles.includes(role) : false;
  }

  /**
   * Inicializar - Restaurar token desde localStorage al montar la app
   */
  static initialize(): void {
    const token = this.getToken();
    if (token) {
      // Restaurar header de autorización
      http.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
}
