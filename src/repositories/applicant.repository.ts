/**
 * ApplicantRepository — llamadas HTTP puras a /rrhh/postulantes
 *
 * Refleja exactamente los endpoints del Swagger:
 *
 *  GET  /postulantes                          → listarPostulantesPorEtapa  (etapa requerida)
 *  GET  /postulantes/reclutamiento            → listarPostulantesReclutamiento
 *  GET  /postulantes/capacitacion             → listarPostulantesCapacitacion
 *  POST /postulantes                          → registrarPostulante
 *  PATCH /postulantes/{id}/estado-reclutamiento
 *  PATCH /postulantes/estado-capacitacion
 *  PATCH /postulantes/{id}/rechazo-inasistencia-capacitacion
 */

import { rrhhHttp } from '../api/http';
import type {
  PostulanteResponse,
  RegistrarPostulanteRequest,
  EventoPostulanteRequest,
  EstadoCapacitacionRequest,
} from '@compartido/tipos';

// Etapas válidas según el backend
export type EtapaProceso = 'RECLUTAMIENTO' | 'CAPACITACION' | 'GESTION' | 'CONTRATADO';

export interface FiltrosPostulante {
  estado?: string;
  subestado?: string;
  origen?: 'COMPUTRABAJO' | 'INDEED' | 'REFERIDO';
  puesto?: string;
  desde?: string;   // YYYY-MM-DD
  hasta?: string;   // YYYY-MM-DD
  listaNegra?: boolean;
}

export class ApplicantRepository {
  /**
   * Listar postulantes por etapa (parámetro requerido por el backend)
   * GET /postulantes?etapa=RECLUTAMIENTO&...
   */
  static async getByEtapa(
    etapa: EtapaProceso,
    filtros?: FiltrosPostulante
  ): Promise<PostulanteResponse[]> {
    const response = await rrhhHttp.get<PostulanteResponse[]>('/postulantes', {
      params: { etapa, ...filtros },
    });
    return response.data;
  }

  /**
   * Listar postulantes en etapa RECLUTAMIENTO (endpoint dedicado)
   * GET /postulantes/reclutamiento
   */
  static async getReclutamiento(filtros?: FiltrosPostulante): Promise<PostulanteResponse[]> {
    const response = await rrhhHttp.get<PostulanteResponse[]>('/postulantes/reclutamiento', {
      params: filtros,
    });
    return response.data;
  }

  /**
   * Listar postulantes en etapa CAPACITACION (endpoint dedicado)
   * GET /postulantes/capacitacion
   */
  static async getCapacitacion(filtros?: FiltrosPostulante): Promise<PostulanteResponse[]> {
    const response = await rrhhHttp.get<PostulanteResponse[]>('/postulantes/capacitacion', {
      params: filtros,
    });
    return response.data;
  }

  /**
   * Registrar nuevo postulante
   * POST /postulantes
   */
  static async create(data: RegistrarPostulanteRequest): Promise<PostulanteResponse> {
    const response = await rrhhHttp.post<PostulanteResponse>('/postulantes', data);
    return response.data;
  }

  /**
   * Actualizar estado en etapa de reclutamiento
   * PATCH /postulantes/{id}/estado-reclutamiento
   */
  static async updateEstadoReclutamiento(
    id: number,
    evento: EventoPostulanteRequest
  ): Promise<PostulanteResponse> {
    const response = await rrhhHttp.patch<PostulanteResponse>(
      `/postulantes/${id}/estado-reclutamiento`,
      evento
    );
    return response.data;
  }

  /**
   * Actualizar estado de capacitación en bulk
   * PATCH /postulantes/estado-capacitacion
   */
  static async updateEstadoCapacitacion(
    cambios: EstadoCapacitacionRequest[]
  ): Promise<PostulanteResponse[]> {
    const response = await rrhhHttp.patch<PostulanteResponse[]>(
      '/postulantes/estado-capacitacion',
      cambios
    );
    return response.data;
  }

  /**
   * Rechazar postulante por inasistencia a capacitación
   * PATCH /postulantes/{id}/rechazo-inasistencia-capacitacion
   */
  static async rechazarPorInasistencia(id: number): Promise<PostulanteResponse> {
    const response = await rrhhHttp.patch<PostulanteResponse>(
      `/postulantes/${id}/rechazo-inasistencia-capacitacion`
    );
    return response.data;
  }
}