/**
 * Applicant Service
 * Lógica de negocio para postulantes
 * Transforma respuestas de la API y maneja lógica específica del dominio
 */

import { ApplicantRepository } from '../repositories/applicant.repository';
import type { Applicant, NewApplicantFormData, PostulanteResponse } from '../types';
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
    if (!data.fullName?.trim()) {
      throw new Error('El nombre completo es requerido');
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
    if (!data.campaign?.trim()) {
      throw new Error('La campaña/origen es requerida');
    }
  }

  /**
   * Preparar datos del postulante para envío al backend
   * Transforma los nombres del frontend al formato del backend
   * Incluye todos los campos que el backend espera
   */
  private static prepareApplicantData(data: NewApplicantFormData): any {
    // Separar el nombre en nombres y apellidos
    const nameParts = data.fullName.trim().split(/\s+/);
    const apellidos = nameParts.length > 1 
      ? nameParts.slice(-1).join(' ') // Último palabra es apellido
      : '';
    const nombres = nameParts.length > 1 
      ? nameParts.slice(0, -1).join(' ') // El resto son nombres
      : nameParts[0]; // Si es una sola palabra, es el nombre
    
    // Convertir puestoTrabajo: reemplazar espacios con guiones bajos
    const puestoTrabajo = data.positionOfInterest.trim().replace(/\s+/g, '_').toUpperCase();
    
    const transformedData: any = {
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      tipoDocumento: data.documentType,
      numeroDocumento: data.documentNumber.trim(),
      celularPersonal: data.phoneMobile.trim(),
      puestoTrabajo: puestoTrabajo,
      origen: data.campaign.trim().toUpperCase(),
      estadoPostulacion: 'EN_PROCESO',
      pagoDiaCapacitacion: data.trainingDayPayment ? parseFloat(String(data.trainingDayPayment)) : 0,
      fechaInicio: data.startDate || '',
      fechaFin: data.endDate || '',
    };

    console.log('[ApplicantService.prepareApplicantData] Transformed object:', JSON.stringify(transformedData, null, 2));
    
    return transformedData;
  }
}