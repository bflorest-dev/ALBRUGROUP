/**
 * Servicio API para Eventos de Leads
 * Endpoints: GET /leads/eventos/lead/{idLead}, GET /leads/eventos/empleado/{idEmpleado}
 * (leadsHttp tiene baseURL /api/leads, así que las rutas son relativas)
 */

import { leadsHttp } from '@shared/api/httpClient';
import { eventoResponseArraySchema, parseApiResponse } from '@shared/api/responseSchemas';
import type { EventoResponse } from '@shared/types';

export class EventosApi {
  /**
   * Obtiene todos los eventos registrados para un Lead específico
   * GET /leads/eventos/lead/{idLead}
   */
  static async getEventosByLead(idLead: number): Promise<EventoResponse[]> {
    const response = await leadsHttp.get<EventoResponse[]>(`/eventos/lead/${idLead}`);
    return parseApiResponse(eventoResponseArraySchema, response.data, 'GET /eventos/lead/{idLead}');
  }

  /**
   * Obtiene todos los eventos registrados por un empleado específico
   * GET /leads/eventos/empleado/{idEmpleado}
   * @param idEmpleado ID del empleado
   * @param fechaDesde Fecha desde (ISO string, opcional)
   * @param fechaHasta Fecha hasta (ISO string, opcional)
   */
  static async getEventosByEmpleado(
    idEmpleado: number,
    fechaDesde?: string,
    fechaHasta?: string
  ): Promise<EventoResponse[]> {
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);

    const queryString = params.toString();
    const url = `/eventos/empleado/${idEmpleado}${queryString ? `?${queryString}` : ''}`;
    const response = await leadsHttp.get<EventoResponse[]>(url);
    return parseApiResponse(
      eventoResponseArraySchema,
      response.data,
      'GET /eventos/empleado/{idEmpleado}',
    );
  }
}
