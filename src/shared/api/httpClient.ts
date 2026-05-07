/**
 * HTTP Client Consolidado
 * 
 * Centraliza TODOS los clientes HTTP con:
 * - JWT Token Management (interceptor)
 * - Error Handling y Logging
 * - Retry automático en timeouts
 * - Validación de responses
 * 
 * Backends disponibles:
 *  - authHttp        → :8080/autorizacion (sin JWT)
 *  - rrhhHttp        → :8080/rrhh (con JWT)
 *  - leadsHttp       → :8080/leads (con JWT)
 *  - recruitmentHttp → :8080/recruitment (con JWT)
 * 
 * FSD: shared/api - Capa de transporte HTTP
 */

import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import { env } from '@shared/config/env';

/**
 * Tipo de error API normalizado
 */
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

/**
 * Wrapper optional para responses con metadata
 */
export interface ApiResult<T = unknown> {
  error: boolean;
  status: number;
  data: T | null;
}

/**
 * ─── INTERCEPTORES ──────────────────────────────────────────────────────────
 */

/**
 * Adjunta JWT Bearer token desde localStorage a todas las requests
 * Usado por rrhhHttp, leadsHttp y recruitmentHttp
 * NO usado por authHttp (login no requiere token)
 */
function addAuthInterceptor(instance: AxiosInstance, instanceName: string): void {
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.debug(`[${instanceName}] ✅ JWT attached`, {
          endpoint: config.url,
          tokenLength: token.length,
          tokenPreview: token.substring(0, 20) + '...',
        });
      } else {
        console.warn(`[${instanceName}] ⚠️ NO TOKEN FOUND in localStorage`, {
          endpoint: config.url,
          localStorageKeys: Object.keys(localStorage),
        });
      }
      return config;
    },
    (error) => {
      console.error(`[${instanceName}] Request interceptor error`, error);
      return Promise.reject(error);
    }
  );
}

/**
 * Manejo centralizado de errores HTTP:
 * - 401 → limpiar sesión
 * - Timeout → reintentar (máx 1x)
 * - Network → error normalizado
 */
function addErrorInterceptor(instance: AxiosInstance, instanceName: string): void {
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      console.debug(`[${instanceName}] Success`, {
        status: response.status,
        url: response.config.url,
        dataKeys: typeof response.data === 'object' ? Object.keys(response.data).length : 'N/A',
      });
      return response;
    },
    async (error: AxiosError | Error) => {
      const suppressErrorLog = error instanceof AxiosError && error.config
        ? (error.config as unknown as { suppressErrorLog?: boolean }).suppressErrorLog === true
        : false;

      // Log de error inicial solo si no está silenciado
      const method = error instanceof AxiosError ? error.config?.method?.toUpperCase() || 'UNKNOWN' : 'UNKNOWN';
      const url = error instanceof AxiosError ? error.config?.url || 'UNKNOWN' : 'UNKNOWN';
      const status = error instanceof AxiosError ? error.response?.status || 'NO_STATUS' : 'NO_STATUS';

      if (!suppressErrorLog) {
        console.error(`[${instanceName}] HTTP Error`, {
          method,
          url,
          status,
          message: error.message,
        });
      }

      // Retry automático en TIMEOUT (ECONNABORTED)
      if (
        error instanceof AxiosError &&
        error.code === 'ECONNABORTED' &&
        error.config
      ) {
        const config = error.config as unknown as { _retryCount?: number };
        if (!config._retryCount) {
          config._retryCount = 1;
          console.warn(`[${instanceName}] TIMEOUT - Retrying request (attempt 1)`, { url, method });
          return instance.request(error.config);
        }
      }

      // 401 → limpiar sesión inmediatamente
      if (error instanceof AxiosError && error.response?.status === 401) {
        console.warn(`[${instanceName}] 401 Unauthorized - Clearing session`);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('user');
      }

      // Normalizar error
      const apiError: ApiError = {
        message: 'Error desconocido',
        status: error instanceof AxiosError ? error.response?.status || 0 : 0,
        code: error instanceof AxiosError ? error.code || 'UNKNOWN' : 'UNKNOWN',
        details: error instanceof AxiosError ? error.response?.data : undefined,
      };

      if (error instanceof AxiosError) {
        if (error.response) {
          // HTTP Error
          const data = error.response.data as Record<string, unknown>;
          apiError.message = typeof data?.message === 'string'
            ? data.message
            : error.response.statusText || 'Error del servidor';
          apiError.code = typeof data?.error === 'string' ? data.error : String(error.response.status);
        } else if (error.request) {
          // Network Error
          apiError.message = 'Sin conexión con el servidor. Verifica que el backend esté corriendo.';
          apiError.code = 'NETWORK_ERROR';
        } else {
          apiError.message = error.message || 'Error desconocido';
          apiError.code = 'UNKNOWN_ERROR';
        }
      } else if (error instanceof Error) {
        apiError.message = error.message || 'Error desconocido';
        apiError.code = 'CLIENT_ERROR';
      } else {
        apiError.message = String(error) || 'Error desconocido';
        apiError.code = 'UNKNOWN_ERROR';
      }

      if (!suppressErrorLog) {
        console.error(`[${instanceName}] Normalized error`, apiError);
      }
      return Promise.reject(apiError);
    }
  );
}

/**
 * ─── HTTP CLIENTS ───────────────────────────────────────────────────────────
 */

/**
 * Cliente para AUTENTICACIÓN
 * - SIN JWT requerido (login no tiene token aún)
 * - Usado por: AuthRepository
 */
export const authHttp: AxiosInstance = axios.create({
  baseURL: env.AUTH_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
addErrorInterceptor(authHttp, 'authHttp');

/**
 * Cliente para RRHH (Recursos Humanos)
 * - CON JWT requerido (Bearer token)
 * - Usado por: EmployeeRepository, ContractRepository, ApplicantRepository
 */
export const rrhhHttp: AxiosInstance = axios.create({
  baseURL: env.RRHH_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
addAuthInterceptor(rrhhHttp, 'rrhhHttp');
addErrorInterceptor(rrhhHttp, 'rrhhHttp');

/**
 * Cliente para LEADS (Planes, Promociones, Eventos)
 * - CON JWT requerido (Bearer token)
 * - Usado por: LeadsRepository
 */
export const leadsHttp: AxiosInstance = axios.create({
  baseURL: env.LEADS_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
addAuthInterceptor(leadsHttp, 'leadsHttp');
addErrorInterceptor(leadsHttp, 'leadsHttp');

/**
 * Cliente para RECRUITMENT (Postulaciones y ofertas laborales)
 * - CON JWT requerido (Bearer token)
 * - Usado por: Postulaciones API
 */
export const recruitmentHttp: AxiosInstance = axios.create({
  baseURL: env.RECRUITMENT_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
addAuthInterceptor(recruitmentHttp, 'recruitmentHttp');
addErrorInterceptor(recruitmentHttp, 'recruitmentHttp');

/**
 * Cliente para PRESENCE (Disponibilidad y Conectados)
 * - CON JWT requerido (Bearer token)
 * - Usado por: PresenceRepository
 */
export const presenceHttp: AxiosInstance = axios.create({
  baseURL: env.PRESENCE_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
addAuthInterceptor(presenceHttp, 'presenceHttp');
addErrorInterceptor(presenceHttp, 'presenceHttp');

/**
 * Alias para backward compatibility
 * Algunos repos importan `http` en lugar de `rrhhHttp`
 */
export const http = rrhhHttp;

/**
 * Default export = rrhhHttp (más usado)
 */
export default rrhhHttp;

/**
 * ─── UTILITIES ───────────────────────────────────────────────────────────────
 */

/**
 * Factory opcional para crear clientes HTTP adicionales si se necesita
 * (No usado actualmente pero disponible para extensión)
 */
export function createHttpClient(
  baseURL: string,
  withAuth: boolean = false,
  instanceName: string = 'httpClient'
): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (withAuth) {
    addAuthInterceptor(client, instanceName);
  }
  addErrorInterceptor(client, instanceName);

  return client;
}

/**
 * Validar que el token JWT esté en localStorage
 * Útil para debugging y testing
 */
export function getStoredToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * Forzar limpieza de sesión (logout)
 * Llamado por error handling en 401
 */
export function clearSession(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  localStorage.removeItem('user');
  console.log('[httpClient] Session cleared');
}
