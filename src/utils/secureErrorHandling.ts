/**
 * Manejo Seguro de Errores
 * 
 * Proporciona funciones para manejar errores de forma segura
 * sin exponer información sensible en mensajes de usuario
 */

/**
 * Tipos de errores seguros (sin información interna)
 */
export const SafeErrorMessages = {
  // Errores generales
  UNKNOWN: 'Ocurrió un error. Por favor intenta nuevamente.',
  NETWORK: 'Error de conexión. Verifica tu conexión a internet.',
  TIMEOUT: 'La solicitud tardó demasiado. Por favor intenta nuevamente.',

  // Errores de validación
  INVALID_INPUT: 'Algunos campos tienen valores inválidos.',
  REQUIRED_FIELD: 'Por favor completa todos los campos requeridos.',

  // Errores de autenticación
  UNAUTHORIZED: 'No autorizado. Por favor inicia sesión nuevamente.',
  FORBIDDEN: 'No tienes permiso para acceder a esto.',

  // Errores de servidor
  SERVER_ERROR: 'Error en el servidor. Por favor intenta más tarde.',
  NOT_FOUND: 'El recurso que buscas no existe.',

  // Errores específicos de la aplicación
  CREATE_FAILED: 'No se pudo crear el registro. Por favor intenta nuevamente.',
  UPDATE_FAILED: 'No se pudo actualizar el registro. Por favor intenta nuevamente.',
  DELETE_FAILED: 'No se pudo eliminar el registro. Por favor intenta nuevamente.',
  FETCH_FAILED: 'No se pudo obtener los datos. Por favor intenta nuevamente.',
} as const;

export type SafeErrorKey = keyof typeof SafeErrorMessages;

/**
 * Mapear códigos de error HTTP a mensajes seguros
 * @param statusCode - Código HTTP
 * @returns Mensaje seguro para mostrar al usuario
 */
export const getHTTPErrorMessage = (statusCode: number | undefined): string => {
  switch (statusCode) {
    case 400:
      return SafeErrorMessages.INVALID_INPUT;
    case 401:
      return SafeErrorMessages.UNAUTHORIZED;
    case 403:
      return SafeErrorMessages.FORBIDDEN;
    case 404:
      return SafeErrorMessages.NOT_FOUND;
    case 408:
      return SafeErrorMessages.TIMEOUT;
    case 500:
    case 502:
    case 503:
    case 504:
      return SafeErrorMessages.SERVER_ERROR;
    default:
      return SafeErrorMessages.UNKNOWN;
  }
};

/**
 * Extraer mensaje seguro de un error
 * @param error - Error object o string
 * @param defaultMessage - Mensaje por defecto si no se puede extraer
 * @returns Mensaje seguro para mostrar al usuario
 */
export const getSafeErrorMessage = (
  error: unknown,
  defaultMessage: string = SafeErrorMessages.UNKNOWN
): string => {
  // Si no hay error, retornar default
  if (!error) return defaultMessage;

  // Si es un string, verificar si es una clave conocida
  if (typeof error === 'string') {
    const keys = Object.keys(SafeErrorMessages) as SafeErrorKey[];
    if (keys.includes(error as SafeErrorKey)) {
      return SafeErrorMessages[error as SafeErrorKey];
    }
    // Si no es clave conocida, no exponer el mensaje directo
    return defaultMessage;
  }

  // Si es un objeto, buscar propiedades conocidas
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, any>;

    // Si tiene una propiedad 'message' de tipo string
    if (typeof errorObj.message === 'string') {
      // Validar que no contenga información sensible
      if (isSafeErrorMessage(errorObj.message)) {
        return errorObj.message;
      }
    }

    // Si tiene 'response.status' (de axios)
    if (errorObj.response?.status) {
      return getHTTPErrorMessage(errorObj.response.status);
    }

    // Si tiene 'statusCode' (genérico)
    if (typeof errorObj.statusCode === 'number') {
      return getHTTPErrorMessage(errorObj.statusCode);
    }

    // Si tiene 'response.data.message' (estructura común)
    if (typeof errorObj.response?.data?.message === 'string') {
      if (isSafeErrorMessage(errorObj.response.data.message)) {
        return errorObj.response.data.message;
      }
    }
  }

  // Fallback a mensaje por defecto
  return defaultMessage;
};

/**
 * Verificar si un mensaje de error es seguro para mostrar al usuario
 * (no contiene información interna o paths locales)
 * @param message - Mensaje a verificar
 * @returns true si es seguro, false si puede contener información sensible
 */
export const isSafeErrorMessage = (message: string): boolean => {
  if (typeof message !== 'string') return false;

  // Patterns que indican información sensible
  const dangerousPatterns = [
    /\/home\//i, // Rutas locales
    /\/var\//i,
    /\/usr\//i,
    /C:\\.*\\/i, // Windows paths
    /at\s+\w+\s+\(/i, // Stack traces
    /Error:\s*/i, // Raw error format
    /SyntaxError/i,
    /TypeError/i,
    /ReferenceError/i,
    /Cannot\s+read\s+property/i, // Información de código
    /__dirname/i, // Node.js variables
    /__filename/i,
    /process\.env/i,
    /password|token|secret|api[_-]?key|auth/i, // Datos sensibles
  ];

  return !dangerousPatterns.some(pattern => pattern.test(message));
};

/**
 * Logger seguro para desarrollo
 * En producción, logs sensibles no se envían a consola
 * @param context - Contexto del log (componente, función)
 * @param message - Mensaje a loguear
 * @param data - Datos opcionales (se sanitizan)
 */
export const safeLog = (
  context: string,
  message: string,
  data?: any
): void => {
  const isDevelopment = import.meta.env.DEV;

  // En desarrollo, loguear todo
  if (isDevelopment) {
    console.log(`[${context}] ${message}`, data || '');
    return;
  }

  // En producción, solo loguear mensajes seguros
  // Sin exponer data sensible en consola
  console.log(`[${context}] ${message}`);
};

/**
 * Logger seguro para errores
 * En producción, no expone stack traces completos
 * @param context - Contexto del error (componente, función)
 * @param error - Error object
 * @param userMessage - Mensaje seguro a mostrar al usuario
 */
export const safeErrorLog = (
  context: string,
  error: unknown,
  userMessage?: string
): string => {
  const isDevelopment = import.meta.env.DEV;
  const safeMessage = getSafeErrorMessage(error, userMessage);

  if (isDevelopment) {
    // En desarrollo, loguear detalles completos
    console.error(`[${context}] Error:`, error);
  } else {
    // En producción, solo loguear identificador del error
    const errorHash = hashError(error);
    console.error(`[${context}] Error ID: ${errorHash}`);
    // En una app real, enviaría esto a un servicio como Sentry
  }

  return safeMessage;
};

/**
 * Crear hash corto de un error para identificarlo sin exponer detalles
 * @param error - Error a hashear
 * @returns String hash corto
 */
const hashError = (error: unknown): string => {
  let errorString = 'unknown';

  if (error instanceof Error) {
    errorString = `${error.name}:${error.message}`;
  } else if (typeof error === 'string') {
    errorString = error;
  } else if (typeof error === 'object' && error !== null) {
    errorString = JSON.stringify(error).substring(0, 100);
  }

  // Simple hash
  let hash = 0;
  for (let i = 0; i < errorString.length; i++) {
    const char = errorString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(16).substring(0, 8);
};

/**
 * Crear error user-friendly
 * @param userMessage - Mensaje a mostrar al usuario
 * @param internalError - Error interno para logging
 * @returns Error con información segura
 */
export const createSafeError = (
  userMessage: string,
  internalError?: any
): Error => {
  const error = new Error(userMessage);

  // Guardar error interno sin exponerlo
  if (internalError) {
    (error as any).__internal = internalError;
  }

  return error;
};
