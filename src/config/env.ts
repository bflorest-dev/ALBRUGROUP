/**
 * Configuración de entorno
 *
 * ARQUITECTURA DEL BACKEND:
 * - Puerto 8080: API Gateway (única entrada)
 * - Auth: POST http://localhost:8080/autorizacion/login
 * - RRHH: http://localhost:8080/rrhh/postulantes, /rrhh/empleados, etc.
 *
 * DESARROLLO (proxy Vite):
 * - Login:   /api/auth/autorizacion/login → :8080/autorizacion/login
 * - RRHH:    /api/rrhh/postulantes       → :8080/rrhh/postulantes
 *
 * PRODUCCIÓN:
 * - VITE_API_URL = https://api.albrugroup.com
 */

const isDev = import.meta.env.DEV;
const prodBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const env = {
  // Base para llamadas de autenticación
  AUTH_BASE_URL: isDev ? '/api/auth' : prodBase,

  // Base para el servicio RRHH (postulantes, empleados, contratos, pagos)
  RRHH_BASE_URL: isDev ? '/api/rrhh' : `${prodBase}/rrhh`,

  DEV: isDev,
} as const;

export const validateEnv = () => {  
  if (import.meta.env.DEV) {
    console.log('[Env] DEV — Auth proxy: /api/auth → :8080');
    console.log('[Env] DEV — RRHH proxy: /api/rrhh → :8080/rrhh');
  } else {
    console.log('[Env] PROD — Base URL:', prodBase);
  }
};

validateEnv();