/**
 * 🔧 API Helper Simple
 * 
 * Wrapper simple sobre axios existente para debug.
 * SIN interceptores nuevos. SIN cambios de lógica.
 * 
 * Uso:
 *   const response = await apiRequest('POST', '/autorizacion/login', {...});
 */

import { authHttp, rrhhHttp, leadsHttp } from './clienteHttp';
import type { AxiosInstance } from 'axios';

export interface ApiRequestOptions {
  service?: 'auth' | 'rrhh' | 'leads';
  timeout?: number;
}

/**
 * Selecciona el cliente HTTP correcto según el servicio
 */
function getClient(service: 'auth' | 'rrhh' | 'leads' = 'auth'): AxiosInstance {
  const clients = {
    auth: authHttp,
    rrhh: rrhhHttp,
    leads: leadsHttp,
  };
  return clients[service];
}

/**
 * Request genérico con logging
 * 
 * @param method GET | POST | PUT | DELETE
 * @param endpoint /autorizacion/login
 * @param data body para POST/PUT
 * @param opts opciones { service, timeout }
 */
export async function apiRequest<T = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: unknown,
  opts: ApiRequestOptions = {}
): Promise<T> {
  const { service = 'auth' } = opts;
  const client = getClient(service);

  try {
    console.log(
      `[API] ${method} ${client.defaults.baseURL}${endpoint}`,
      data ? `| body: ${JSON.stringify(data).substring(0, 100)}...` : ''
    );

    let response;
    switch (method) {
      case 'GET':
        response = await client.get<T>(endpoint);
        break;
      case 'POST':
        response = await client.post<T>(endpoint, data);
        break;
      case 'PUT':
        response = await client.put<T>(endpoint, data);
        break;
      case 'DELETE':
        response = await client.delete<T>(endpoint);
        break;
    }

    console.log(`[API] ✅ ${method} ${endpoint} | Response:`, response?.data);
    return response!.data;
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : JSON.stringify(error).substring(0, 200);

    console.error(`[API] ❌ ${method} ${endpoint} | Error: ${errorMsg}`);

    // Detectar errores de conexión
    if (errorMsg.includes('Failed to fetch')) {
      console.error(
        '[API] 🚨 No hay conexión. Verifica que el servers esté corriendo en :8080'
      );
    }

    throw error;
  }
}

/**
 * Helpers específicos para mantener compatibilidad
 */
export const apiHelpers = {
  /**
   * Login simple
   * POST /autorizacion/login → http://localhost:8080/autorizacion/login
   */
  async login(username: string, password: string) {
    return apiRequest('POST', '/autorizacion/login', { username, password }, {
      service: 'auth',
    });
  },

  /**
   * Validar estado de acceso del usuario
   * GET /autorizacion/estado-acceso/{username}
   */
  async checkUserStatus(username: string) {
    return apiRequest(
      'GET',
      `/autorizacion/estado-acceso/${username}`,
      undefined,
      { service: 'auth' }
    );
  },

  /**
   * Recuperar contraseña
   * POST /autorizacion/forgot-password
   */
  async forgotPassword(payload: { username?: string; email?: string; dni?: string; newPassword?: string }) {
    return apiRequest(
      'POST',
      '/autorizacion/forgot-password',
      payload,
      { service: 'auth' }
    );
  },
};
