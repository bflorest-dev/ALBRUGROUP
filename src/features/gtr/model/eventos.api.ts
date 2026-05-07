/**
 * Servicio API para Eventos de Leads
 * Usa LeadsRepository para mantener consistencia y validación de schemas
 */

import { LeadsRepository } from '@shared/api/repositories/leads.repository';
import type { EventoResponse } from '@shared/types';

export type { EventoResponse };

export class EventosApi {
  /**
   * Obtiene todos los eventos registrados para un Lead específico
   * GET /eventos/lead/{idLead}
   */
  static async getEventosByLead(idLead: number): Promise<EventoResponse[]> {
    return LeadsRepository.getEventosPorLead(idLead);
  }

  /**
   * Obtiene todos los eventos registrados por un empleado específico
   * GET /eventos/empleado/{idEmpleado}
   * @param idEmpleado ID del empleado
   * @param fechaDesde Fecha desde (ISO string, opcional)
   * @param fechaHasta Fecha hasta (ISO string, opcional)
   */
  static async getEventosByEmpleado(
    idEmpleado: number,
    fechaDesde?: string,
    fechaHasta?: string
  ): Promise<EventoResponse[]> {
    const params: Record<string, unknown> = {};
    if (fechaDesde) params.fechaDesde = fechaDesde;
    if (fechaHasta) params.fechaHasta = fechaHasta;

    return LeadsRepository.getEventosPorEmpleado(idEmpleado, params);
  }
}
