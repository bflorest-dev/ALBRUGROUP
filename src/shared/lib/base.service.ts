/**
 * Base Service
 * Clase abstracta para servicios que manejan lógica de negocio
 * 
 * FSD Layer: shared/lib
 * Proporciona utilidades como manejo de errores y ejecutores de operaciones
 */

import type { PageResponse } from '@shared/types';

export type RepositoryMethod<T = any> = () => Promise<T>;
export type DataAdapter<Input = any, Output = any> = (data: Input) => Output;

export interface PagedResponse<T> {
  items: T[];
  total: number;
  totalPages: number;
}

/**
 * Clase base para todos los servicios
 * Proporciona métodos reutilizables para ejecutar operaciones con manejo de errores
 */
export class BaseService<EntityType = any> {
  /**
   * Ejecutar una operación HTTP y adaptar la respuesta
   */
  protected static executeOperation<T, R = T>(
    operation: RepositoryMethod<T>,
    errorMessage: string = 'Error en operación',
    adapter?: DataAdapter<T, R>
  ): Promise<R> {
    return operation()
      .then((data) => (adapter ? adapter(data) : (data as unknown as R)))
      .catch((error) => {
        const formatted = this.formatError(error, errorMessage);
        throw formatted;
      });
  }

  /**
   * Ejecutar una operación que retorna paginación
   * Soporta tanto PageResponse<T> como respuestas con estructura { data, total, totalPages }
   */
  protected static executePagedOperation<T, R = T>(
    operation: RepositoryMethod<PageResponse<T> | { data: T[]; total: number; totalPages?: number }>,
    errorMessage: string = 'Error en operación paginada',
    adapter?: DataAdapter<T, R>
  ): Promise<PagedResponse<R>> {
    return operation()
      .then((response) => {
        // Soportar ambas formas: PageResponse<T> (content/items) o { data, total, totalPages }
        const items = 'data' in response 
          ? response.data 
          : response.content || response.items || [];
        
        return {
          items: items.map((item) => (adapter ? adapter(item) : (item as unknown as R))),
          total: response.total,
          totalPages: response.totalPages || Math.ceil(response.total / items.length) || 0,
        };
      })
      .catch((error) => {
        const formatted = this.formatError(error, errorMessage);
        throw formatted;
      });
  }

  /**
   * Formatear errores de forma consistente
   */
  protected static formatError(error: unknown, fallbackMessage: string): Error {
    if (error instanceof Error) {
      return new Error(`${fallbackMessage}: ${error.message}`);
    }
    if (typeof error === 'string') {
      return new Error(`${fallbackMessage}: ${error}`);
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return new Error(`${fallbackMessage}: ${(error as any).message}`);
    }
    return new Error(fallbackMessage);
  }
}

