/**
 * Utilidades de Rate Limiting y Throttling
 * 
 * Previene spam de user actions (múltiples clicks, requests rápidos, etc)
 * Mejora performance y seguridad evitando DoS type behavior
 */

/**
 * Debounce: Ejecutar función solo después de cierto tiempo sin actividad
 * Útil para búsquedas, validaciones, cambios de filtros
 * @param func - Función a ejecutar
 * @param delay - Delay en ms antes de ejecutar
 * @returns Función debounced
 * 
 * @example
 * const debouncedSearch = useDebounce((term) => {
 *   fetchResults(term);
 * }, 300);
 * 
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 */
export function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function debounced(...args: Parameters<T>) {
    // Cancelar timeout anterior
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Establecer nuevo timeout
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle: Ejecutar función máximo una vez cada cierto tiempo
 * Útil para clicks, scroll, resize events
 * @param func - Función a ejecutar
 * @param delay - Delay mínimo entre ejecuciones en ms
 * @returns Función throttled
 * 
 * @example
 * const throttledClick = useThrottle(() => {
 *   submitForm();
 * }, 1000); // máximo una vez por segundo
 * 
 * <button onClick={throttledClick}>Submit</button>
 */
export function useThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function throttled(...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= delay) {
      // Suficiente tiempo ha pasado, ejecutar inmediatamente
      func(...args);
      lastCallTime = now;

      // Cancelar timeout pendiente si existe
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    } else {
      // No ha pasado suficiente tiempo, programar ejecución
      if (timeoutId === null) {
        timeoutId = setTimeout(() => {
          func(...args);
          lastCallTime = Date.now();
          timeoutId = null;
        }, delay - timeSinceLastCall);
      }
    }
  };
}

/**
 * Clase para gestionar rate limiting con ventana deslizante
 * Útil para APIs, form submissions, etc
 * @example
 * const limiter = new RateLimiter(5, 60000); // 5 requests por minuto
 * 
 * const canSubmit = limiter.isAllowed('form-submit');
 * if (canSubmit) {
 *   await submitForm();
 * } else {
 *   showError('Demasiados intentos. Espera un momento.');
 * }
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  /**
   * @param maxRequests - Número máximo de requests permitidos
   * @param windowMs - Ventana de tiempo en milisegundos
   */
  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Verificar si una acción es permitida
   * @param key - Identificador único (usuário, endpoint, etc)
   * @returns true si es permitido, false si se excedió el límite
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Obtener requests previos para esta key
    let requests = this.requests.get(key) || [];

    // Filtrar requests fuera de la ventana
    requests = requests.filter(time => time > windowStart);

    // Verificar si se puede hacer otro request
    if (requests.length < this.maxRequests) {
      // Agregar nuevo request
      requests.push(now);
      this.requests.set(key, requests);
      return true;
    }

    // Límite alcanzado
    return false;
  }

  /**
   * Obtener tiempo de espera antes de poder hacer otro request (en ms)
   * @param key - Identificador único
   * @returns Milisegundos até permitir siguiente request, o 0 si permitido
   */
  getWaitTime(key: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const requests = this.requests.get(key) || [];
    const filteredRequests = requests.filter(time => time > windowStart);

    if (filteredRequests.length < this.maxRequests) {
      return 0; // Permitido
    }

    // Retornar tiempo hasta el request más viejo
    const oldestRequest = Math.min(...filteredRequests);
    return oldestRequest + this.windowMs - now;
  }

  /**
   * Resetear límite para una key específica
   * @param key - Identificador único
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Resetear todos los límites
   */
  resetAll(): void {
    this.requests.clear();
  }
}

/**
 * Crear RateLimiter para form submissions
 * Previene múltiples envíos del mismo formulario
 * @returns RateLimiter configurado para form submissions
 * 
 * @example
 * const formLimiter = createFormSubmitLimiter();
 * 
 * const handleSubmit = (e) => {
 *   if (!formLimiter.isAllowed('lead-form')) {
 *     const wait = formLimiter.getWaitTime('lead-form');
 *     showError(`Espera ${Math.ceil(wait / 1000)}s antes de reintentar`);
 *     return;
 *   }
 *   submitForm();
 * };
 */
export function createFormSubmitLimiter(): RateLimiter {
  // 3 submissions máximo por 60 segundos
  return new RateLimiter(3, 60000);
}

/**
 * Crear RateLimiter para API calls
 * @returns RateLimiter configurado para API calls
 * 
 * @example
 * const apiLimiter = createAPILimiter();
 * 
 * if (apiLimiter.isAllowed('search')) {
 *   const results = await searchAPI(query);
 * }
 */
export function createAPILimiter(): RateLimiter {
  // 10 requests máximo por 10 segundos
  return new RateLimiter(10, 10000);
}

/**
 * Hook para proteger contra doble clic en botones
 * Deshabilita button temporalmente después del click
 * @param onClickHandler - Handler del click
 * @param debounceMs - Tiempo a deshabilitar en ms
 * @returns {onClick, isDisabled}
 * 
 * @example
 * const { onClick, isDisabled } = useClickThrottle((e) => {
 *   submitForm();
 * }, 2000);
 * 
 * <button onClick={onClick} disabled={isDisabled}>
 *   {isDisabled ? 'Cargando...' : 'Submit'}
 * </button>
 */
export function useClickThrottle(
  onClickHandler: (e: React.MouseEvent<HTMLButtonElement>) => void,
  debounceMs: number = 1000
): { onClick: (e: React.MouseEvent<HTMLButtonElement>) => void; isDisabled: boolean } {
  const [isDisabled, setIsDisabled] = React.useState(false);

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) return;

    // Ejecutar handler
    onClickHandler(e);

    // Deshabilitar temporalmente
    setIsDisabled(true);
    setTimeout(() => setIsDisabled(false), debounceMs);
  };

  return { onClick, isDisabled };
}

// Importar React para useClickThrottle
import React from 'react';

/**
 * Crear limiter global para un recurso específico
 * Evita que múltiples instancias pidan al mismo recurso
 * @param resource - Identificador del recurso
 * @param maxConcurrent - Máximo de requests concurrentes
 * @returns {canRequest, releaseRequest}
 * 
 * @example
 * const limiter = createConcurrencyLimiter('fetch-users', 1);
 * 
 * if (limiter.canRequest()) {
 *   await fetchUsers();
 *   limiter.releaseRequest();
 * }
 */
export function createConcurrencyLimiter(
  resource: string,
  maxConcurrent: number = 1
): { canRequest: () => boolean; releaseRequest: () => void } {
  const state = new Map<string, number>();
  state.set(resource, 0);

  return {
    canRequest: () => {
      const current = state.get(resource) || 0;
      if (current < maxConcurrent) {
        state.set(resource, current + 1);
        return true;
      }
      return false;
    },
    releaseRequest: () => {
      const current = state.get(resource) || 0;
      if (current > 0) {
        state.set(resource, current - 1);
      }
    },
  };
}
