import { useCallback } from 'react';

export interface ErrorHandler {
  handleError: (error: Error, errorInfo?: { componentStack?: string }) => void;
  resetError: () => void;
}

/**
 * Hook personalizado para manejar errores en componentes funcionales
 * Útil cuando necesitas manejar errores de forma programática
 */
export const useErrorHandler = (): ErrorHandler => {
  const handleError = useCallback((error: Error, errorInfo?: { componentStack?: string }) => {
    // Aquí podrías enviar el error a un servicio externo
    // reportError(error, errorInfo);

    // Para componentes funcionales, puedes usar este hook junto con
    // un estado local o un contexto para mostrar UI de error
  }, []);

  const resetError = useCallback(() => {
    // Resetear el estado de error
  }, []);

  return {
    handleError,
    resetError
  };
};

/**
 * Función utilitaria para crear errores con contexto adicional
 */
export const createError = (message: string, context?: Record<string, unknown>): Error => {
  const error = new Error(message);

  if (context) {
    // Agregar contexto adicional al error
    (error as Error & { context: Record<string, unknown> }).context = context;
  }

  return error;
};

/**
 * Función utilitaria para reportar errores a servicios externos
 * Esta es una implementación básica - en producción usarías Sentry, LogRocket, etc.
 */
export const reportError = (error: Error, errorInfo?: { componentStack?: string }) => {
  // Implementación básica de logging
  console.error('Error reportado:', {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  });

  // En producción, aquí enviarías a un servicio como:
  // - Sentry: Sentry.captureException(error)
  // - LogRocket: LogRocket.captureException(error)
  // - Bugsnag: Bugsnag.notify(error)
};