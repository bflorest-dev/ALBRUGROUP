/**
 * Configuración de entorno
 * 
 * ARQUITECTURA:
 * - Puerto 8080: API Gateway (único medio de entrada)
 * 
 * DESARROLLO:
 * - Frontend corre en:     http://localhost:5173+
 * - Vite Proxy: /auth → http://localhost:8080
 * - Axios baseURL debe ser /auth (usa el proxy)
 * - Requests: POST /auth/autorizacion/login → Vite proxy → :8080
 * 
 * PRODUCCIÓN:
 * - Frontend apunta al gateway:  http://localhost:8080 (o dominio real)
 */

const isDev = import.meta.env.DEV;

export const env = {
  // En desarrollo: usar /auth (que el proxy Vite reescribe a :8080)
  // En producción: usar el gateway 8080
  API_URL: isDev ? '/auth' : (import.meta.env.VITE_API_URL || 'http://localhost:8080'),
  
  // Gateway URL (para referencias)
  BACKEND_URL: 'http://localhost:8080',
  // Auth service URL (única entrada a través del gateway 8080)
  AUTH_SERVICE_URL: 'http://localhost:8080',
  
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