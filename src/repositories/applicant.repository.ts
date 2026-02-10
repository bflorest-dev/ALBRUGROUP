/**
 * Applicant Repository
 * Capa de acceso a datos para postulantes
 * Solo contiene llamadas HTTP puras sin lógica de negocio
 */

import { http, type ApiResponse } from '../api/http';
import type { Applicant, NewApplicantFormData } from '../types';

// Tipos específicos para las respuestas de la API
export type ApplicantApiResponse = ApiResponse<Applicant>;
export type ApplicantsApiResponse = ApiResponse<Applicant[]>;
export type CreateApplicantApiResponse = ApiResponse<Applicant>;
export type UpdateApplicantApiResponse = ApiResponse<Applicant>;
export type DeleteApplicantApiResponse = ApiResponse<void>;

export class ApplicantRepository {
  /**
   * Obtener todos los postulantes
   */
  static async getAll(): Promise<Applicant[]> {
    const response = await http.get<ApplicantsApiResponse>('/applicants');
    return response.data.data;
  }

  /**
   * Obtener postulante por ID
   */
  static async getById(id: string): Promise<Applicant> {
    const response = await http.get<ApplicantApiResponse>(`/applicants/${id}`);
    return response.data.data;
  }

  /**
   * Crear nuevo postulante
   */
  static async create(applicantData: NewApplicantFormData): Promise<Applicant> {
    const response = await http.post<CreateApplicantApiResponse>('/applicants', applicantData);
    return response.data.data;
  }

  /**
   * Actualizar postulante existente
   */
  static async update(id: string, applicantData: Partial<Applicant>): Promise<Applicant> {
    const response = await http.put<UpdateApplicantApiResponse>(`/applicants/${id}`, applicantData);
    return response.data.data;
  }

  /**
   * Eliminar postulante
   */
  static async delete(id: string): Promise<void> {
    await http.delete<DeleteApplicantApiResponse>(`/applicants/${id}`);
  }

  /**
   * Buscar postulantes por término
   */
  static async search(searchTerm: string): Promise<Applicant[]> {
    const response = await http.get<ApplicantsApiResponse>(`/applicants/search`, {
      params: { q: searchTerm }
    });
    return response.data.data;
  }

  /**
   * Convertir postulante en empleado (contratación)
   */
  static async hire(id: string, employeeData: Record<string, unknown>): Promise<{ applicant: Applicant; employee: Record<string, unknown> }> {
    const response = await http.post<ApiResponse<{ applicant: Applicant; employee: Record<string, unknown> }>>(`/applicants/${id}/hire`, employeeData);
    return response.data.data;
  }

  /**
   * Obtener estadísticas de postulantes
   */
  static async getStatistics(): Promise<{ total: number; byPosition: Record<string, number>; byCampaign: Record<string, number> }> {
    const response = await http.get<ApiResponse<{ total: number; byPosition: Record<string, number>; byCampaign: Record<string, number> }>>('/applicants/statistics');
    return response.data.data;
  }
}