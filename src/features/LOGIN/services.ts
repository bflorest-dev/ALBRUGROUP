import type { LoginRequest, LoginResponse } from './types';
import { AuthService } from '../../services/auth.service';

/**
 * Realiza el login usando el servicio de autenticación
 * Valida credenciales contra el backend
 * 
 * @param payload - {username, password}
 * @returns LoginResponse con token y datos del usuario
 * @throws Error si las credenciales son inválidas o hay error de conexión
 */
export const login = async (payload: LoginRequest): Promise<LoginResponse> => {
  try {
    return await AuthService.login(payload);
  } catch (error: unknown) {
    // Convertir error de AuthService a mensaje legible
    if (error instanceof Error) {
      throw new Error(
        error.message.includes('401') || error.message.includes('403')
          ? 'Usuario o contraseña incorrectos'
          : error.message
      );
    }
    throw new Error('Error de autenticación');
  }
};

/**
 * Realiza logout limpiando tokens y sesión
 */
export const logout = (): void => {
  AuthService.logout();
};
