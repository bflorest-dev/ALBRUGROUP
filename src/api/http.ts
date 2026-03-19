/**
 * Clientes HTTP centralizados
 *
 * El backend tiene DOS bases de URL distintas:
 *  - authHttp  → autenticación  (sin JWT requerido)
 *  - rrhhHttp  → servicio RRHH  (requiere JWT Bearer)
 *
 * Proxy Vite en desarrollo:
 *  /api/auth/autorizacion/login  →  :8080/autorizacion/login
 *  /api/rrhh/postulantes         →  :8080/rrhh/postulantes
 */

import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { env } from '../config/env';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// ─── Interceptor: adjuntar JWT ────────────────────────────────────────────────
function addAuthInterceptor(instance: AxiosInstance): void {
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}

// ─── Interceptor: manejo de errores ──────────────────────────────────────────
function addErrorInterceptor(instance: AxiosInstance): void {
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      // 401 → limpiar sesión
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }

      if (error.response) {
        const data = error.response.data as Record<string, unknown>;
        const apiError: ApiError = {
          message: typeof data?.message === 'string' ? data.message : 'Error del servidor',
          code: typeof data?.error === 'string' ? data.error : String(error.response.status),
          status: error.response.status,
        };
        return Promise.reject(apiError);
      }

      if (error.request) {
        return Promise.reject({
          message: 'Sin conexión con el servidor. Verifica que el backend esté corriendo en :8080.',
          code: 'NETWORK_ERROR',
        } as ApiError);
      }

      return Promise.reject({ message: error.message || 'Error desconocido' } as ApiError);
    }
  );
}

// ─── Cliente de Autenticación ─────────────────────────────────────────────────
// POST /autorizacion/login  (no lleva /rrhh porque es el gateway directo)
export const authHttp: AxiosInstance = axios.create({
  baseURL: env.AUTH_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});
addErrorInterceptor(authHttp);

// ─── Cliente del Servicio RRHH ────────────────────────────────────────────────
// /postulantes, /empleados, /contratos, /pagos
export const rrhhHttp: AxiosInstance = axios.create({
  baseURL: env.RRHH_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});
addAuthInterceptor(rrhhHttp);
addErrorInterceptor(rrhhHttp);

// Alias de compatibilidad para imports existentes que usan `http`
export const http = rrhhHttp;
export default rrhhHttp;