import { authHttp } from '../httpClient';
import type {
  ActualizarCredencialesRequest,
  UsuarioResponse,
  EstadoAccesoResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  AuthLoginResponse,
} from '@shared/types';

/**
 * Request para login (backwards compatibility con entidades/auth)
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Response para login - adapter de AuthLoginResponse
 * (backwards compatibility con entidades/auth)
 */
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
   * FLUJO DE AUTENTICACIÓN CON VALIDACIÓN PREVIA
   * 
   * Paso 1: Validar usuario y obtener estado de contraseña
   * GET /autorizacion/estado-acceso/{username}
   * 
   * ⚠️ IMPORTANTE: Este endpoint REQUIERE autenticación (Authorization: Bearer <token>)
   * según la documentación del backend. NO se puede usar antes del login.
   * 
   * Solo debe usarse DESPUÉS de que el usuario haya iniciado sesión, si se necesita
   * verificar el estado de otro usuario.
   */
  static async obtenerEstadoAcceso(username: string): Promise<EstadoAccesoResponse> {
    return authHttp
      .get<EstadoAccesoResponse>(`/autorizacion/estado-acceso/${username}`)
      .then((res) => res.data)
      .catch((error) => {
        // Si es 401, significa que no hay token o el token es inválido
        if (error.response?.status === 401) {
          throw new Error('No autenticado: Este endpoint requiere un token válido');
        }
        throw new Error('Usuario inválido o no registrado');
      });
  }

  /**
   * Paso 2: Iniciar sesión con credenciales validadas
   * POST /autorizacion/login
   */
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    console.log('[AuthRepository] 📤 Enviando login request:', {
      username: credentials.username,
      passwordLength: credentials.password?.length || 0,
      endpoint: '/autorizacion/login',
      baseURL: '/api/auth',
    });

    // LIMPIAR COMPLETAMENTE cualquier token viejo
    console.log('[AuthRepository] 🧹 Limpiando localStorage antes del login...');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('user');
    
    // También limpiar headers globales de axios si existen
    if (typeof window !== 'undefined') {
      try {
        // Importar dinámicamente para evitar problemas de dependencias circulares
        const { rrhhHttp, leadsHttp } = await import('../httpClient');
        delete rrhhHttp.defaults.headers.common['Authorization'];
        delete leadsHttp.defaults.headers.common['Authorization'];
        console.log('[AuthRepository] 🧹 Headers globales limpiados');
      } catch (e) {
        console.warn('[AuthRepository] ⚠️ No se pudieron limpiar headers globales:', e);
      }
    }

    const response = await authHttp
      .post<AuthLoginResponse>('/autorizacion/login', {
        username: credentials.username,
        password: credentials.password,
      })
      .then((res) => {
        console.log('[AuthRepository] ✅ Login response recibida:', {
          status: res.status,
          hasToken: !!res.data.token,
          username: res.data.username,
          roles: res.data.roles,
        });
        return res.data;
      })
      .catch((error) => {
        console.error('[AuthRepository] ❌ Login error:', {
          status: error.status,
          message: error.message,
          details: error.details,
        });
        throw new Error(
          error.message || error.response?.data?.message || 'Credenciales inválidas'
        );
      });

    // Adapt AuthLoginResponse to LoginResponse
    return {
      token: response.token,
      type: response.type,
      username: response.username,
      empleadoId: response.empleadoId,
      nombreCompleto: response.nombreCompleto,
      roles: response.roles,
    };
  }

  /**
   * Paso 3: Resetear contraseña olvidada
   * POST /autorizacion/forgot-password
   */
  static async olvidoContraseña(
    payload: ForgotPasswordRequest
  ): Promise<ForgotPasswordResponse> {
    return authHttp
      .post<ForgotPasswordResponse>('/autorizacion/forgot-password', payload)
      .then((res) => res.data)
      .catch((error) => {
        throw new Error(
          error.response?.data?.message || 'Información no válida'
        );
      });
  }

  /**
   * Verificar si un empleado existe en la BD por ID
   * GET /autorizacion/{empleadoId}/empleado
   */
  static async verificarEmpleadoExiste(empleadoId: number): Promise<boolean> {
    try {
      await authHttp.get(`/autorizacion/${empleadoId}/empleado`);
      return true;
    } catch (error) {
      // 404 o 403 = no existe
      return false;
    }
  }

  /**
   * Actualizar username y roles de un usuario (requiere puestoTrabajo)
   * PATCH /autorizacion/{empleadoId}/username-roles
   */
  static async updateUsernameRoles(
    empleadoId: number,
    payload: ActualizarCredencialesRequest
  ): Promise<UsuarioResponse> {
    return authHttp
      .patch<UsuarioResponse>(
        `/autorizacion/${empleadoId}/username-roles`,
        payload
      )
      .then((res) => res.data);
  }

  /**
   * Obtener usuario por ID de empleado
   * GET /autorizacion/{empleadoId}/usuario
   */
  static async getUserByEmployeeId(empleadoId: number): Promise<UsuarioResponse> {
    return authHttp
      .get<UsuarioResponse>(`/autorizacion/${empleadoId}/usuario`)
      .then((res) => res.data)
      .catch((error) => {
        throw new Error(
          error.response?.data?.message || `Usuario con empleadoId ${empleadoId} no encontrado`
        );
      });
  }
}

