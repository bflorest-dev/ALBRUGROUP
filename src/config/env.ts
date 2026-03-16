/**
 * Configuración de entorno
 * 
 * ARQUITECTURA:
 * - Puerto 8080: API Gateway (reenvía a otros servicios)
 * - Puerto 8081: Servicio de Autenticación (donde realmente está el login)
 * 
 * DESARROLLO:
 * - Frontend corre en:     http://localhost:5173+
 * - Vite Proxy: /auth → http://localhost:8081
 * - Axios baseURL debe ser /auth (usa el proxy)
 * - Requests: POST /auth/autorizacion/login → Vite proxy → :8081
 * 
 * PRODUCCIÓN:
 * - Frontend apunta al gateway:  http://localhost:8080 (o dominio real)
 */

const isDev = import.meta.env.DEV;

export const env = {
  // En desarrollo: usar /auth (que el proxy Vite reescribe a :8081)
  // En producción: usar el gateway 8080
  API_URL: isDev ? '/auth' : (import.meta.env.VITE_API_URL || 'http://localhost:8080'),
  
  // Gateway URL (para referencias)
  BACKEND_URL: 'http://localhost:8080',
  // Auth service URL (donde está el servicio real de autenticación)
  AUTH_SERVICE_URL: 'http://localhost:8081',
  
  // Modo desarrollo
  DEV: isDev,
} as const;

/**
 * Validación de configuración requerida
 */
export const validateEnv = () => {
  if (!env.API_URL) {
    throw new Error('API_URL is required but not defined');
  }
  
  if (import.meta.env.DEV) {
    console.log('[Env Config] Development mode - using proxy: /api → http://localhost:8080');
  } else {
    console.log('[Env Config] Production mode - API_URL:', env.API_URL);
  }
};

// Ejecutar validación al importar
validateEnv();