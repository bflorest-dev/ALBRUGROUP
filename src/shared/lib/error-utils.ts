/**
 * Utilidades para manejo de errores
 * Proporciona funciones helper para manejar errores de forma type-safe
 */

/**
 * Extrae el mensaje de error de forma segura
 */
export function getErrorMessage(error: unknown, fallback: string = 'Error desconocido'): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    const errorObj = error as { message: unknown };
    if (typeof errorObj.message === 'string') {
      return errorObj.message;
    }
  }
  
  return fallback;
}

/**
 * Extrae el status code de un error de forma segura
 */
export function getErrorStatus(error: unknown): number {
  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    const response = errorObj.response;
    const responseStatus =
      response && typeof response === 'object'
        ? (response as { status?: unknown }).status
        : undefined;
    
    // Intentar obtener status de diferentes propiedades comunes
    const status = errorObj.status || errorObj.statusCode || responseStatus;
    
    if (typeof status === 'number') {
      return status;
    }
  }
  
  return 0;
}

/**
 * Verifica si un error es de autenticación (401)
 */
export function isAuthError(error: unknown): boolean {
  const status = getErrorStatus(error);
  return status === 401;
}

/**
 * Verifica si un error es de autorización (403)
 */
export function isForbiddenError(error: unknown): boolean {
  const status = getErrorStatus(error);
  return status === 403;
}

/**
 * Verifica si un error es de red/conectividad
 */
export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes('network') || message.includes('fetch') || message.includes('connection');
}