/**
 * Auth Service
 * Lógica de autenticación y gestión de sesión JWT
 * 
 * FSD Layer: entities/auth/model
 */

import { rrhhHttp, leadsHttp } from '@shared/api/clienteHttp';
import { AuthRepository, type LoginRequest, type LoginResponse } from '@shared/api/repositories/auth.repository';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export interface CurrentUser {
  username: string;
  empleadoId: number;
  nombreCompleto: string;
  roles: string[];
}

export class AuthService {
  private static getObject(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
  }

  /**
   * Decodificar JWT y obtener payload
   */
  static getPayloadFromToken(token: string): unknown {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodeURIComponent(escape(decoded)));
    } catch {
      return null;
    }
  }

  /**
   * Obtener rol del payload JWT
   */
  static getRoleFromToken(token: string): string | null {
    const payload = AuthService.getObject(AuthService.getPayloadFromToken(token));
    if (!payload) return null;

    const rol = payload.rol;
    const role = payload.role;
    const roles = payload.roles;
    const auth = payload.auth;

    if (typeof rol === 'string') return rol;
    if (typeof role === 'string') return role;
    if (Array.isArray(roles) && typeof roles[0] === 'string') return roles[0];
    if (Array.isArray(auth) && typeof auth[0] === 'string') return auth[0];
    return null;
  }

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

    // Obtener rol del payload o la respuesta
    const rawResponse = response as unknown as Record<string, unknown>;
    const usuario = AuthService.getObject(rawResponse.usuario);
    const responseRole = typeof usuario?.rol === 'string' ? usuario.rol : undefined;
    const tokenRole = AuthService.getRoleFromToken(token);
    const role = responseRole || (roles && roles[0]) || tokenRole || undefined;
    const normalizedRoles = role
      ? [role.toUpperCase()]
      : Array.isArray(roles)
      ? roles.map((r) => String(r).toUpperCase())
      : tokenRole
      ? [tokenRole.toUpperCase()]
      : [];

    // Persistir sesión
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify({ username, empleadoId, nombreCompleto, roles: normalizedRoles }));
    localStorage.setItem('user', JSON.stringify({ id: String(empleadoId), name: nombreCompleto, roles: normalizedRoles }));

    // Inyectar token en headers
    const authHeader = `${type} ${token}`;
    rrhhHttp.defaults.headers.common['Authorization'] = authHeader;
    leadsHttp.defaults.headers.common['Authorization'] = authHeader;

    return {
      token: response.token,
      type: response.type,
      username: response.username,
      empleadoId: response.empleadoId,
      nombreCompleto: response.nombreCompleto,
      roles: normalizedRoles,
    };
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
