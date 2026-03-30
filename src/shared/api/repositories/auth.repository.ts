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
   */
  static async obtenerEstadoAcceso(username: string): Promise<EstadoAccesoResponse> {
    return authHttp
      .get<EstadoAccesoResponse>(`/autorizacion/estado-acceso/${username}`)
      .then((res) => res.data)
      .catch((error) => {
        throw new Error('Usuario inválido o no registrado');
      });
  }

  /**
   * Paso 2: Iniciar sesión con credenciales validadas
   * POST /autorizacion/login
   */
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await authHttp
      .post<AuthLoginResponse>('/autorizacion/login', {
        username: credentials.username,
        password: credentials.password,
      })
      .then((res) => res.data)
      .catch((error) => {
        throw new Error(
          error.response?.data?.message || 'Credenciales inválidas'
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
}
