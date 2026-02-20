/**
 * Applicant Service
 * Lógica de negocio para postulantes
 * Transforma respuestas de la API y maneja lógica específica del dominio
 */

import { ApplicantRepository } from '../repositories/applicant.repository';
import type { Applicant, NewApplicantFormData } from '../types';
import { adaptPostulanteResponseToApplicant } from '../types';

export class ApplicantService {
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
    try {
      // Validar datos antes de enviar
      this.validateApplicantData(applicantData);

      // Transformar datos si es necesario
      const transformedData = this.prepareApplicantData(applicantData);

      console.log('[ApplicantService.createApplicant] Sending data to POST /postulantes:', JSON.stringify(transformedData, null, 2));
      
      const newApplicant = await ApplicantRepository.create(transformedData);
      
      console.log('[ApplicantService.createApplicant] Backend response:', newApplicant);
      
      const adaptedApplicant = adaptPostulanteResponseToApplicant(newApplicant);
      console.log('[ApplicantService.createApplicant] Adapted applicant:', adaptedApplicant);
      
      return adaptedApplicant;
    } catch (error) {
      console.error('[ApplicantService.createApplicant] Full error object:', error);
      if (error instanceof Error) {
        console.error('[ApplicantService.createApplicant] Error message:', error.message);
        console.error('[ApplicantService.createApplicant] Error stack:', error.stack);
      }
      throw new Error('No se pudo crear el postulante');
    }
  }

  /**
   * Actualizar postulante
   */
  static async updateApplicant(id: string, applicantData: any): Promise<Applicant> {
    try {
      // Antes de enviar al backend debemos mapear los campos igual que en create
      // para que utilice las mismas claves que el API espera (p.ej. puestoTrabajo, origen, compania, etc.)
      // Validamos también los campos básicos para evitar peticiones inválidas.
      try {
        this.validateApplicantData(applicantData);
      } catch (validationError) {
        // no hacemos throw directo para poder loggear, pero sí propagamos
        console.error('[ApplicantService.updateApplicant] Validation failed:', validationError);
        throw validationError;
      }

      const transformedData = this.prepareApplicantData(applicantData);

      const updatedApplicant = await ApplicantRepository.update(id, transformedData);
      return adaptPostulanteResponseToApplicant(updatedApplicant);
    } catch (error) {
      console.error('Error updating applicant:', error);
      throw new Error('No se pudo actualizar el postulante');
    }
  }

  /**
   * Actualizar estados de postulantes en bulk
   */
  static async updateApplicantStatuses(changes: any): Promise<Applicant[]> {
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

  // Métodos privados para validación

  /**
   * Validar datos del postulante
   */
  private static validateApplicantData(data: NewApplicantFormData): void {
    if (!data.nombres?.trim()) {
      throw new Error('Los nombres son requeridos');
    }
    if (!data.apellidos?.trim()) {
      throw new Error('Los apellidos son requeridos');
    }
    if (!data.phoneMobile?.trim()) {
      throw new Error('El número de celular es requerido');
    }
    if (!data.documentNumber?.trim()) {
      throw new Error('El número de documento es requerido');
    }
    if (!data.documentType) {
      throw new Error('El tipo de documento es requerido');
    }
    if (!data.positionOfInterest?.trim()) {
      throw new Error('La posición de interés es requerida');
    }
    if (!data.company?.trim()) {
      throw new Error('La compañía es requerida');
    }
    if (!data.campaign?.trim()) {
      throw new Error('La campaña/origen es requerida');
    }
  }

  /**
   * Preparar datos del postulante para envío al backend
   * Ya vienen separados en nombres y apellidos desde el formulario
   * Solo necesita transformar el puesto de trabajo y origen
   */
  private static prepareApplicantData(data: NewApplicantFormData): any {
    // Convertir puestoTrabajo: reemplazar espacios con guiones bajos
    const puestoTrabajo = data.positionOfInterest.trim().replace(/\s+/g, '_').toUpperCase();
    
    const transformedData: any = {
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

    console.log('[ApplicantService.prepareApplicantData] Transformed object:', JSON.stringify(transformedData, null, 2));
    
    return transformedData;
  }
}