/**
 * Configuración HTTP centralizada
 * Instancia de Axios con interceptores para manejo de errores y configuración global
 */

import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { env } from '../config/env';

// Tipos para respuestas de API
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown[]; // detalles de error arbitrarios
}

// Crear instancia de Axios configurada
const http: AxiosInstance = axios.create({
  baseURL: env.API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de solicitud para agregar tokens de autenticación
http.interceptors.request.use(
  (config) => {
    // Obtener token JWT del localStorage
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    config.headers['Accept'] = 'application/json';

    if (!config.headers['X-Client-Type']) {
      config.headers['X-Client-Type'] = 'FRONTEND';
    }

    const csrfToken = getCsrfTokenFromCookie();
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.getAttribute('content');
    
    if (csrfToken) {
      const headerName = csrfHeader || 'X-CSRF-TOKEN';
      config.headers[headerName] = csrfToken;
    }

    console.log('[HTTP Interceptor] 📤 Solicitud:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      data: config.data,
      headers: config.headers,
    });

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Extraer CSRF token de las cookies si está disponible
 * Spring Security típicamente lo guarda en la cookie XSRF-TOKEN
 */
function getCsrfTokenFromCookie(): string | null {
  const name = 'XSRF-TOKEN';
  const match = document.cookie.match(new RegExp(`(^|;\\s*)(${name})=([^;]*)`));
  return match ? decodeURIComponent(match[3]) : null;
}

// Interceptor de respuesta para manejar errores globalmente y 401 Unauthorized
http.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('[HTTP Interceptor] 📥 Respuesta exitosa:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error: AxiosError) => {
    // Si es error 401, limpiar token
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      delete http.defaults.headers.common['Authorization'];
      console.error('[HTTP Interceptor] 🔐 401 Unauthorized - Token inválido o expirado');
    }

    // Manejar errores de forma centralizada
    if (error.response) {
      // Error de respuesta del servidor
      const data = error.response.data as unknown as Record<string, unknown>;
      
      console.error('[HTTP Interceptor] ❌ Error de API');
      console.error('[HTTP Interceptor]   - Status:', error.response.status);
      console.error('[HTTP Interceptor]   - Status Text:', error.response.statusText);
      console.error('[HTTP Interceptor]   - URL:', error.config?.url);
      console.error('[HTTP Interceptor]   - Respuesta:', error.response.data);
      
      const apiError: ApiError = {
        message: typeof data.message === 'string' ? data.message : 'Error del servidor',
        code: typeof data.error === 'string' ? data.error : undefined,
        status: error.response.status,
        details: Array.isArray(data.details) ? data.details : undefined,
      };

      throw apiError;
    } else if (error.request) {
      // Error de red (no hay respuesta)
      console.error('[HTTP Interceptor] 🌐 Error de conexión');
      console.error('[HTTP Interceptor]   - Request:', error.request);
      
      const networkError: ApiError = {
        message: 'Error de conexión. Verifica tu conexión a internet.',
        code: 'NETWORK_ERROR',
      };

      throw networkError;
    } else {
      // Error desconocido
      console.error('[HTTP Interceptor] ❓ Error desconocido:', error);
      
      const unknownError: ApiError = {
        message: error.message || 'Error desconocido',
        code: 'UNKNOWN_ERROR',
      };

      throw unknownError;
    }
  }
);

export { http };
export default http;