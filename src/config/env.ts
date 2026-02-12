/**
 * Configuración de entorno
 * Maneja las variables de entorno de la aplicación
 */

export const env = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
} as const;

/**
 * Validación de configuración requerida
 */
export const validateEnv = () => {
  if (!env.API_URL) {
    throw new Error('VITE_API_URL is required but not defined in environment variables');
  }
};

// Ejecutar validación al importar
validateEnv();