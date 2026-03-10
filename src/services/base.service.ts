/**
 * Base Service - Abstracción común para todos los servicios
 * Elimina duplicación de try-catch y transformación de datos
 */

/**
 * Tipo genérico para métodos de repositorio que retornan T
 */
export type RepositoryMethod<T> = () => Promise<T>;

/**
 * Tipo genérico para adaptadores (transformar respuesta del API)
 */
export type DataAdapter<Src, Dst> = (source: Src) => Dst;

/**
 * Clase base para todos los servicios
 * Proporciona manejo centralizado de errores y transformación de datos
 * 
 * Tipo genérico T: Representa el tipo de datos que maneja el servicio
 * Se usa en las subclases, no en la clase base (compatible con erasableSyntaxOnly)
 */
export abstract class BaseService<_T = unknown> {
  /**
   * Ejecutar una operación del repositorio con manejo de errores
   * @param operation - Función que ejecuta la operación del repositorio
   * @param errorMessage - Mensaje de error a mostrar si falla
   * @param adapter - Función para adaptar la respuesta (opcional)
   * @returns Resultado adaptado o error
   */
  protected static async executeOperation<R, A = R>(
    operation: RepositoryMethod<R>,
    errorMessage: string,
    adapter?: (response: R) => A
  ): Promise<A> {
    try {
      const result = await operation();
      return adapter ? adapter(result) : (result as unknown as A);
    } catch (error) {
      console.error(`[${this.name}] ${errorMessage}`, error);
      throw this.formatError(error, errorMessage);
    }
  }

  /**
   * Ejecutar una operación que retorna múltiples items
   * Útil para búsquedas y listas paginadas
   */
  protected static async executePagedOperation<R extends { content: unknown[]; totalElements: number; totalPages: number }, A>(
    operation: RepositoryMethod<R>,
    errorMessage: string,
    adapter: (item: any) => A
  ): Promise<{ items: A[]; total: number; totalPages: number }> {
    try {
      const result = await operation();
      return {
        items: result.content.map(adapter),
        total: result.totalElements,
        totalPages: result.totalPages,
      };
    } catch (error) {
      console.error(`[${this.name}] ${errorMessage}`, error);
      throw this.formatError(error, errorMessage);
    }
  }

  /**
   * Formatear errores consistentemente
   */
  protected static formatError(error: unknown, fallbackMessage: string): Error {
    if (error instanceof Error) {
      return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return new Error((error as { message: string }).message);
    }
    return new Error(fallbackMessage);
  }
}
