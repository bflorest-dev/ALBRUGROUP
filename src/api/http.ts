/**
 * Configuración HTTP centralizada
 * Instancia de Axios con interceptores para manejo de errores y configuración global
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { env } from '../config/env';

// Tipos para respuestas de API
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
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
    // Manejar errores de forma centralizada
    if (error.response) {
      // Error de respuesta del servidor
      const apiError: ApiError = {
        message: (error.response.data as { message?: string })?.message || 'Error del servidor',
        code: (error.response.data as { code?: string })?.code,
        status: error.response.status,
      };

      // Log detallado en desarrollo
      if (import.meta.env.DEV) {
        console.error('API Error:', {
          status: error.response.status,
          data: error.response.data,
          config: error.config,
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
        console.error('Network Error:', error.request);
      }

      throw networkError;
    } else {
      // Error desconocido
      const unknownError: ApiError = {
        message: error.message || 'Error desconocido',
        code: 'UNKNOWN_ERROR',
      };

      if (import.meta.env.DEV) {
        console.error('Unknown Error:', error);
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