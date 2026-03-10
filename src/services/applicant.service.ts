/**
 * Applicant Service
 * Lógica de negocio para postulantes
 * Transforma respuestas de la API y maneja lógica específica del dominio
 */

import { BaseService } from './base.service';
import { ApplicantRepository } from '../repositories/applicant.repository';
import type { Applicant, NewApplicantFormData, PostulanteRequest, ApplicantStatusChange } from '../types';
import { adaptPostulanteResponseToApplicant } from '../types';
import { validateDataOrThrow, NewApplicantFormDataSchema } from '../validation/schemas';

export class ApplicantService extends BaseService<Applicant> {
  /**
   * Obtener todos los postulantes con filtros
   */
  static async getAllApplicants(params?: { estado?: string; puesto?: string; desde?: string; hasta?: string }): Promise<Applicant[]> {
    try {
      const applicants = await ApplicantRepository.getAll(params);
      return applicants.map(adaptPostulanteResponseToApplicant);
    } catch (error) {
      console.error('Error fetching applicants:', error);
      throw new Error('No se pudieron cargar los postulantes');
    }
  }

  /**
   * Crear nuevo postulante
   */
  static async createApplicant(applicantData: NewApplicantFormData): Promise<Applicant> {
    // Validar datos con Zod
    const validatedData = validateDataOrThrow(NewApplicantFormDataSchema, applicantData);

    // Transformar datos para el backend
    const transformedData = this.prepareApplicantData(validatedData);
    
    return this.executeOperation(
      () => ApplicantRepository.create(transformedData),
      'No se pudo crear el postulante',
      adaptPostulanteResponseToApplicant
    );
  }

  /**
   * Actualizar postulante
   */
  static async updateApplicant(id: string, applicantData: NewApplicantFormData): Promise<Applicant> {
    // Validar datos con Zod
    const validatedData = validateDataOrThrow(NewApplicantFormDataSchema, applicantData);

    // Transformar datos para el backend
    const transformedData = this.prepareApplicantData(validatedData);

    return this.executeOperation(
      () => ApplicantRepository.update(id, transformedData),
      'No se pudo actualizar el postulante',
      adaptPostulanteResponseToApplicant
    );
  }

  /**
   * Actualizar estados de postulantes en bulk
   */
  static async updateApplicantStatuses(changes: ApplicantStatusChange[]): Promise<Applicant[]> {
    try {
      const applicants = await ApplicantRepository.updateStatuses(changes);
      return applicants.map(adaptPostulanteResponseToApplicant);
    } catch (error) {
      console.error('Error updating applicant statuses:', error);
      throw new Error('No se pudieron actualizar los estados');
    }
  }

  /**
   * Nota: hireApplicant y getStatistics no están implementados en el backend
   * Las estadísticas se calculan localmente en el componente usando useMemo
   */

  // ============================================================================
  // Método privado para transformación de datos
  // ============================================================================

  /**
   * Preparar datos del postulante para envío al backend
   * Transforma el puesto de trabajo y origen según formato esperado por la API
   */
  private static prepareApplicantData(data: NewApplicantFormData): PostulanteRequest {
    // Convertir puestoTrabajo: reemplazar espacios con guiones bajos
    const puestoTrabajo = data.positionOfInterest.trim().replace(/\s+/g, '_').toUpperCase();
    
    const transformedData: PostulanteRequest = {
      nombres: data.nombres.trim(),
      apellidos: data.apellidos.trim(),
      tipoDocumento: data.documentType,
      numeroDocumento: data.documentNumber.trim(),
      celularPersonal: data.phoneMobile.trim(),
      puestoTrabajo: puestoTrabajo,
      compania: data.company?.trim().toUpperCase() || undefined,
      origen: data.campaign.trim().toUpperCase(),
      estadoPostulacion: 'POSTULANTE',
      // backend may handle missing dates/payments itself
    };


    
    return transformedData;
  }
}