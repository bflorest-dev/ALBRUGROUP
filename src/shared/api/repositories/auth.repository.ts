import { authHttp, getStoredToken } from '../httpClient';
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
      const token = getStoredToken();
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
      await authHttp.get(`/autorizacion/${empleadoId}/empleado`, config);
      return true;
    } catch (error) {
      // 404 o 403 = no existe
      return false;
    }
  }

  /**
   * Obtener usuario por ID de empleado
   * GET /autorizacion/{empleadoId}/empleado
   */
  static async getUserByEmployeeId(empleadoId: number): Promise<UsuarioResponse> {
    const token = getStoredToken();
    if (!token) {
      throw new Error('No se encontró auth_token en localStorage');
    }
    const response = await authHttp.get<UsuarioResponse>(
      `/autorizacion/${empleadoId}/empleado`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const raw = response.data as Partial<UsuarioResponse> & Record<string, unknown>;
    return {
      id: Number(raw.id ?? raw.empleadoId ?? empleadoId),
      username: String(raw.username ?? ''),
      email: String(raw.email ?? raw.correo ?? ''),
      empleadoId: Number(raw.empleadoId ?? empleadoId),
      nombreCompleto: String(raw.nombreCompleto ?? raw.fullName ?? ''),
      dni: raw.dni != null ? String(raw.dni) : undefined,
      activo: raw.activo !== false,
      roles: Array.isArray(raw.roles) ? raw.roles.map((role) => String(role)) : [],
    };
  }

  /**
   * Actualizar username y roles de un usuario (requiere puestoTrabajo)
   * PATCH /autorizacion/{empleadoId}/username-roles
   */
  static async updateUsernameRoles(
    empleadoId: number,
    payload: ActualizarCredencialesRequest
  ): Promise<UsuarioResponse> {
    const token = getStoredToken();
    if (!token) {
      throw new Error('No se encontró auth_token en localStorage');
    }
    return authHttp
      .patch<UsuarioResponse>(
        `/autorizacion/${empleadoId}/username-roles`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => res.data);
  }
}
