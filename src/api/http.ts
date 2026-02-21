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

// Interceptor de respuesta para manejar errores globalmente
http.interceptors.response.use(
  (response: AxiosResponse) => {
    // Retornar la respuesta directamente si es exitosa
    return response;
  },
  (error: AxiosError) => {
    // Manejar errores de forma centralizada según formato del backend
    if (error.response) {
      // Error de respuesta del servidor
      const data = error.response.data as unknown as Record<string, unknown>;
      const apiError: ApiError = {
        message: typeof data.message === 'string' ? data.message : 'Error del servidor',
        code: typeof data.error === 'string' ? data.error : undefined,
        status: error.response.status,
        details: Array.isArray(data.details) ? data.details : undefined,
      };

      // Log detallado en desarrollo
      if (import.meta.env.DEV) {
        console.error('[HTTP Interceptor] API Error Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          message: data.message,
          error: data.error,
          details: data.details,
          fullData: error.response.data,
          requestUrl: error.config?.url,
          requestData: error.config?.data,
        });
      }

      throw apiError;
    } else if (error.request) {
      // Error de red (no hay respuesta)
      const networkError: ApiError = {
        message: 'Error de conexión. Verifica tu conexión a internet.',
        code: 'NETWORK_ERROR',
      };

      if (import.meta.env.DEV) {
        console.error('[HTTP Interceptor] Network Error:', error.request);
      }

      throw networkError;
    } else {
      // Error desconocido
      const unknownError: ApiError = {
        message: error.message || 'Error desconocido',
        code: 'UNKNOWN_ERROR',
      };

      if (import.meta.env.DEV) {
        console.error('[HTTP Interceptor] Unknown Error:', error);
      }

      throw unknownError;
    }
  }
);

// Interceptor de solicitud para agregar tokens de autenticación si es necesario
http.interceptors.request.use(
  (config) => {
    // Aquí se pueden agregar headers de autenticación
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { http };
export default http;