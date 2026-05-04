/**
 * Oferta Laboral Service
 * API client para gestionar ofertas laborales
 * Base URL: usa env.RECRUITMENT_BASE_URL o /api/recruitment por defecto
 * Endpoint: POST /ofertas-laborales
 */

import { env } from '@shared/config/env';
import type {
  CreateOfertaLaboralRequest,
  CreateAmpliacionRequest,
  UpdateEstadoOfertaRequest,
  OfertaLaboralResponse,
  OfertaAmpliacionResponse,
} from '@shared/types';

// ============================================================================
// ERROR API
// ============================================================================

/**
 * Error estructurado de API
 */
export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  path?: string;
  timestamp?: string;
}

// ============================================================================
// SERVICIO
// ============================================================================

/**
 * Clase para gestionar operaciones de Ofertas Laborales
 */
export class OfertaLaboralService {
  private static readonly BASE_URL =
    env.RECRUITMENT_BASE_URL || '/api/recruitment';

  /**
   * Crear una nueva oferta laboral
   * POST /ofertas-laborales
   *
   * @param data - Datos de la oferta a crear
   * @returns Promise con los datos de la oferta creada
   * @throws Error si la solicitud falla
   */
  static async createOfertaLaboral(data: CreateOfertaLaboralRequest): Promise<OfertaLaboralResponse> {
    try {
      const url = `${this.BASE_URL}/ofertas-laborales`;

      const token = this.getAuthToken();
      if (!token) {
        throw new Error('No auth_token encontrado en localStorage/sessionStorage');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      if (import.meta.env.DEV) {
        console.debug('[OfertaLaboralService] auth_token present:', !!token);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      // Manejo de errores HTTP
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw this.formatError(response.status, errorData);
      }

      const result: OfertaLaboralResponse = await response.json();
      return result;
    } catch (error) {
      // Si es un error ya formateado, re-lanzar
      if (error instanceof Error && error.message.startsWith('HTTP')) {
        throw error;
      }

      // Si es error de red u otro
      throw new Error(
        `Error al crear oferta laboral: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }

  /**
   * Obtener lista de ofertas laborales activas
   * GET /recruitment/ofertas-laborales/activas
   *
   * @returns Promise con array de ofertas activas
   * @throws Error si la solicitud falla
   */
  static async getOfertasActivas(): Promise<OfertaLaboralResponse[]> {
    try {
      const url = `${this.BASE_URL}/ofertas-laborales/activas`;

      const token = this.getAuthToken();
      if (!token) {
        throw new Error('No auth_token encontrado en localStorage/sessionStorage');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      if (import.meta.env.DEV) {
        console.debug('[OfertaLaboralService] Fetching ofertas activas...');
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      // Manejo de errores HTTP
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw this.formatError(response.status, errorData);
      }

      const result: OfertaLaboralResponse[] = await response.json();
      return result;
    } catch (error) {
      // Si es un error ya formateado, re-lanzar
      if (error instanceof Error && error.message.startsWith('HTTP')) {
        throw error;
      }

      // Si es error de red u otro
      throw new Error(
        `Error al obtener ofertas activas: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }

  /**
   * Crear una ampliación de oferta laboral
   * POST /ofertas-laborales/{idOfertaLaboral}/ampliacion
   *
   * @param ofertaId - ID de la oferta a ampliar
   * @param data - Datos de la ampliación (cantidad, plazo)
   * @returns Promise con los datos de la ampliación creada
   * @throws Error si la solicitud falla
   */
  static async createAmpliacion(
    ofertaId: number,
    data: CreateAmpliacionRequest
  ): Promise<OfertaAmpliacionResponse> {
    try {
      const url = `${this.BASE_URL}/ofertas-laborales/${ofertaId}/ampliacion`;

      const token = this.getAuthToken();
      if (!token) {
        throw new Error('No auth_token encontrado en localStorage/sessionStorage');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      if (import.meta.env.DEV) {
        console.debug('[OfertaLaboralService] Creating ampliacion:', {
          url,
          ofertaId,
          data,
          tokenPresent: !!token,
          tokenLength: token.length,
          headers: { 'Content-Type': headers['Content-Type'], 'Authorization': 'Bearer [REDACTED]' }
        });
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (import.meta.env.DEV) {
        console.debug('[OfertaLaboralService] Response status:', response.status);
      }

      // Manejo de errores HTTP
      if (!response.ok) {
        const errorData: ApiErrorResponse = await this.parseErrorResponse(response);
        if (import.meta.env.DEV) {
          console.error('[OfertaLaboralService] Error response:', errorData);
        }
        throw this.formatError(response.status, errorData);
      }

      const result: OfertaAmpliacionResponse = await response.json();
      if (import.meta.env.DEV) {
        console.debug('[OfertaLaboralService] Ampliación creada:', result);
      }
      return result;
    } catch (error) {
      // Si es un error ya formateado, re-lanzar
      if (error instanceof Error && error.message.startsWith('HTTP')) {
        throw error;
      }

      // Si es error de red u otro
      throw new Error(
        `Error al crear ampliación: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }

  /**
   * Actualizar estado de una oferta laboral
   * PATCH /ofertas-laborales/{ofertaId}/estado
   *
   * @param ofertaId - ID de la oferta
   * @param data - Nuevo estado
   * @returns Promise con la oferta actualizada
   * @throws Error si la solicitud falla
   */
  static async updateEstadoOferta(
    ofertaId: number,
    data: UpdateEstadoOfertaRequest
  ): Promise<OfertaLaboralResponse> {
    try {
      const url = `${this.BASE_URL}/ofertas-laborales/${ofertaId}/estado`;

      const token = this.getAuthToken();
      if (!token) {
        throw new Error('No auth_token encontrado en localStorage/sessionStorage');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      if (import.meta.env.DEV) {
        console.debug('[OfertaLaboralService] Updating estado for oferta:', {
          ofertaId,
          nuevoEstado: data.estado,
        });
      }

      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      });

      if (import.meta.env.DEV) {
        console.debug('[OfertaLaboralService] Response status:', response.status);
      }

      // Manejo de errores HTTP
      if (!response.ok) {
        const errorData: ApiErrorResponse = await this.parseErrorResponse(response);
        if (import.meta.env.DEV) {
          console.error('[OfertaLaboralService] Error response:', errorData);
        }
        throw this.formatError(response.status, errorData);
      }

      const result: OfertaLaboralResponse = await response.json();
      if (import.meta.env.DEV) {
        console.debug('[OfertaLaboralService] Estado actualizado:', result);
      }
      return result;
    } catch (error) {
      // Si es un error ya formateado, re-lanzar
      if (error instanceof Error && error.message.startsWith('HTTP')) {
        throw error;
      }

      // Si es error de red u otro
      throw new Error(
        `Error al actualizar estado: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }

  /**
   * Obtener token de autenticación del sessionStorage/localStorage
   * @returns Token JWT o vacío si no existe
   */
  private static getAuthToken(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
  }

  /**
   * Parsear respuesta de error del backend, incluso si el cuerpo está vacío
   */
  private static async parseErrorResponse(response: Response): Promise<ApiErrorResponse> {
    try {
      const text = await response.text();
      if (!text) {
        return {
          statusCode: response.status,
          message: response.statusText || 'Respuesta vacía del servidor',
        };
      }
      return JSON.parse(text) as ApiErrorResponse;
    } catch {
      return {
        statusCode: response.status,
        message: response.statusText || 'Respuesta no válida del servidor',
      };
    }
  }

  /**
   * Formatear error HTTP en mensaje amigable para usuario
   * @param status - Código HTTP
   * @param errorData - Respuesta de error del servidor
   * @returns Error formateado
   */
  private static formatError(status: number, errorData: ApiErrorResponse): Error {
    const messages: Record<number, string> = {
      400: 'Error en los datos enviados. Revisa el formulario.',
      401: 'Tu sesión expiró. Por favor, inicia sesión nuevamente.',
      403: 'No tienes permiso para acceder a las ofertas laborales.',
      404: 'Oferta no encontrada.',
      409: 'Ya existe una oferta con este código.',
      500: 'Error en el servidor. Intenta más tarde.',
    };

    const userMessage = messages[status] || `Error ${status}: ${errorData.message}`;
    return new Error(`HTTP ${status}: ${userMessage}`);
  }
}
