/**
 * Applicant Repository
 * Capa de acceso a datos para postulantes
 * Solo contiene llamadas HTTP puras sin lógica de negocio
 */

import { http } from '../api/http';
import type { PostulanteResponse, PostulanteRequest, ApplicantStatusChange } from '../types';

// Tipos específicos para las respuestas de la API
export type ApplicantsResponse = PostulanteResponse[];
export type ApplicantResponse = PostulanteResponse;
export type CreateApplicantResponse = PostulanteResponse;

export class ApplicantRepository {
  /**
   * Obtener todos los postulantes con filtros
   */
  static async getAll(params?: {
    estado?: string;
    puesto?: string;
    desde?: string;
    hasta?: string;
  }): Promise<PostulanteResponse[]> {
    const response = await http.get<ApplicantsResponse>('/postulantes', { params });
    return response.data;
  }

  /**
   * Crear nuevo postulante
   */
  static async create(applicantData: PostulanteRequest): Promise<PostulanteResponse> {
    const response = await http.post<CreateApplicantResponse>('/postulantes', applicantData);
    return response.data;
  }

  /**
   * Actualizar un postulante específico
   */
  static async update(id: string, applicantData: PostulanteRequest): Promise<PostulanteResponse> {
    // algunos backend esperan PUT para actualización completa
    const response = await http.put<ApplicantResponse>(`/postulantes/${id}`, applicantData);
    return response.data;
  }

  /**
   * Actualizar estados de postulantes en bulk
   */
  static async updateStatuses(changes: ApplicantStatusChange[]): Promise<PostulanteResponse[]> {
    const response = await http.patch<ApplicantsResponse>('/postulantes', changes);
    return response.data;
  }
}