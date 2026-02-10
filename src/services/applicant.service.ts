/**
 * Applicant Service
 * Lógica de negocio para postulantes
 * Transforma respuestas de la API y maneja lógica específica del dominio
 */

import { ApplicantRepository } from '../repositories/applicant.repository';
import type { Applicant, NewApplicantFormData } from '../types';

export class ApplicantService {
  /**
   * Obtener todos los postulantes
   */
  static async getAllApplicants(): Promise<Applicant[]> {
    try {
      const applicants = await ApplicantRepository.getAll();
      return this.transformApplicants(applicants);
    } catch (error) {
      console.error('Error fetching applicants:', error);
      throw new Error('No se pudieron cargar los postulantes');
    }
  }

  /**
   * Obtener postulante por ID
   */
  static async getApplicantById(id: string): Promise<Applicant> {
    try {
      const applicant = await ApplicantRepository.getById(id);
      return this.transformApplicant(applicant);
    } catch (error) {
      console.error('Error fetching applicant:', error);
      throw new Error('No se pudo cargar el postulante');
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

      const newApplicant = await ApplicantRepository.create(transformedData);
      return this.transformApplicant(newApplicant);
    } catch (error) {
      console.error('Error creating applicant:', error);
      throw new Error('No se pudo crear el postulante');
    }
  }

  /**
   * Actualizar postulante
   */
  static async updateApplicant(id: string, applicantData: Partial<Applicant>): Promise<Applicant> {
    try {
      const updatedApplicant = await ApplicantRepository.update(id, applicantData);
      return this.transformApplicant(updatedApplicant);
    } catch (error) {
      console.error('Error updating applicant:', error);
      throw new Error('No se pudo actualizar el postulante');
    }
  }

  /**
   * Eliminar postulante
   */
  static async deleteApplicant(id: string): Promise<void> {
    try {
      await ApplicantRepository.delete(id);
    } catch (error) {
      console.error('Error deleting applicant:', error);
      throw new Error('No se pudo eliminar el postulante');
    }
  }

  /**
   * Buscar postulantes
   */
  static async searchApplicants(searchTerm: string): Promise<Applicant[]> {
    try {
      const applicants = await ApplicantRepository.search(searchTerm);
      return this.transformApplicants(applicants);
    } catch (error) {
      console.error('Error searching applicants:', error);
      throw new Error('Error en la búsqueda de postulantes');
    }
  }

  /**
   * Contratar postulante (convertir en empleado)
   */
  static async hireApplicant(applicantId: string, employeeData: Record<string, unknown>): Promise<{ applicant: Applicant; employee: Record<string, unknown> }> {
    try {
      const result = await ApplicantRepository.hire(applicantId, employeeData);
      return {
        applicant: this.transformApplicant(result.applicant),
        employee: result.employee, // Asumimos que viene transformado del backend
      };
    } catch (error) {
      console.error('Error hiring applicant:', error);
      throw new Error('No se pudo contratar al postulante');
    }
  }

  /**
   * Obtener estadísticas de postulantes
   */
  static async getApplicantStatistics(): Promise<{
    total: number;
    byPosition: Record<string, number>;
    byCampaign: Record<string, number>;
  }> {
    try {
      return await ApplicantRepository.getStatistics();
    } catch (error) {
      console.error('Error fetching applicant statistics:', error);
      throw new Error('No se pudieron cargar las estadísticas de postulantes');
    }
  }

  // Métodos privados para transformación y validación

  /**
   * Transformar lista de postulantes
   */
  private static transformApplicants(applicants: Applicant[]): Applicant[] {
    return applicants.map(applicant => this.transformApplicant(applicant));
  }

  /**
   * Transformar postulante individual
   */
  private static transformApplicant(applicant: Applicant): Applicant {
    return {
      ...applicant,
      // Aquí se pueden hacer transformaciones adicionales
      fullName: applicant.fullName?.trim() || '',
      phoneMobile: applicant.phoneMobile?.trim() || '',
      documentNumber: applicant.documentNumber?.trim() || '',
      positionOfInterest: applicant.positionOfInterest?.toUpperCase() || '',
    };
  }

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
    if (!data.modality) {
      throw new Error('La modalidad es requerida');
    }
  }

  /**
   * Preparar datos del postulante para envío
   */
  private static prepareApplicantData(data: NewApplicantFormData): NewApplicantFormData {
    return {
      ...data,
      fullName: data.fullName.trim(),
      phoneMobile: data.phoneMobile.trim(),
      documentNumber: data.documentNumber.trim(),
      positionOfInterest: data.positionOfInterest.trim().toUpperCase(),
      personalEmail: data.personalEmail?.trim().toLowerCase(),
    };
  }
}