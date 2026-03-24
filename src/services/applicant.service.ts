/**
 * ApplicantService — Lógica de negocio para postulantes
 *
 * Transforma datos del formulario UI al formato que espera el backend
 * y delega las llamadas HTTP al ApplicantRepository.
 *
 * CAMBIOS RESPECTO A LA VERSIÓN ANTERIOR:
 * - getAll() usaba parámetros incorrectos (estado, puesto).
 *   El backend exige `etapa` como campo REQUERIDO.
 * - PostulanteRequest tenía `estadoPostulacion` que no existe en el backend.
 * - El campo `compania` es REQUERIDO por el backend (no opcional).
 */

import { BaseService } from './base.service';
import { ApplicantRepository } from '../repositories/applicant.repository';
import type { Applicant, NewApplicantFormData, RegistrarPostulanteRequest } from '@compartido/tipos';
import { adaptPostulanteResponseToApplicant } from '@compartido/tipos';
import { validateDataOrThrow, NewApplicantFormDataSchema } from '../validation/schemas';

// Etapas válidas del proceso (del Swagger)
export type EtapaProceso = 'RECLUTAMIENTO' | 'CAPACITACION' | 'GESTION' | 'CONTRATADO';

export interface FiltrosPostulante {
  estado?: string;
  subestado?: string;
  origen?: 'COMPUTRABAJO' | 'INDEED' | 'REFERIDO';
  puesto?: string;
  desde?: string;
  hasta?: string;
  listaNegra?: boolean;
}

export class ApplicantService extends BaseService<Applicant> {

  /**
   * Listar postulantes en etapa RECLUTAMIENTO
   * GET /postulantes/reclutamiento
   */
  static async getReclutamiento(filtros?: FiltrosPostulante): Promise<Applicant[]> {
    try {
      const raw = await ApplicantRepository.getReclutamiento(filtros);
      return raw.map(adaptPostulanteResponseToApplicant);
    } catch (error) {
      throw this.formatError(error, 'No se pudieron cargar los postulantes de reclutamiento');
    }
  }

  /**
   * Listar postulantes en etapa CAPACITACION
   * GET /postulantes/capacitacion
   */
  static async getCapacitacion(filtros?: FiltrosPostulante): Promise<Applicant[]> {
    try {
      const raw = await ApplicantRepository.getCapacitacion(filtros);
      return raw.map(adaptPostulanteResponseToApplicant);
    } catch (error) {
      throw this.formatError(error, 'No se pudieron cargar los postulantes de capacitación');
    }
  }

  /**
   * Listar postulantes por etapa genérica
   * GET /postulantes?etapa=...
   *
   * NOTA: `etapa` es REQUERIDO por el backend. Sin él, la llamada falla.
   */
  static async getByEtapa(etapa: EtapaProceso, filtros?: FiltrosPostulante): Promise<Applicant[]> {
    try {
      const raw = await ApplicantRepository.getByEtapa(etapa, filtros);
      return raw.map(adaptPostulanteResponseToApplicant);
    } catch (error) {
      throw this.formatError(error, `No se pudieron cargar los postulantes de ${etapa}`);
    }
  }

  /**
   * Crear nuevo postulante
   * POST /postulantes
   *
   * Transforma NewApplicantFormData (estructura UI) →
   * RegistrarPostulanteRequest (estructura backend).
   */
  static async createApplicant(formData: NewApplicantFormData): Promise<Applicant> {
    // 1. Validar con Zod
    const validatedData = validateDataOrThrow(NewApplicantFormDataSchema, formData);

    // 2. Transformar al formato del backend
    const payload = this.toBackendRequest(validatedData);

    // 3. Llamar al repositorio y adaptar la respuesta
    return this.executeOperation(
      () => ApplicantRepository.create(payload),
      'No se pudo crear el postulante',
      adaptPostulanteResponseToApplicant
    );
  }

  // ─── Método privado de transformación ──────────────────────────────────────

  /**
   * Convierte el formulario de la UI al request del backend.
   *
   * Reglas de transformación:
   * - puestoTrabajo: espacios → guiones bajos, mayúsculas  ("Asesor Ventas" → "ASESOR_VENTAS")
   * - origen: mayúsculas                                    ("computrabajo" → "COMPUTRABAJO")
   * - compania: mayúsculas                                  ("albru" → "ALBRU")
   *
   * Campos que NO existen en el backend y se eliminan:
   * - estadoPostulacion (el backend lo asigna internamente)
   * - pagoDiaCapacitacion (no va en el registro inicial)
   * - fechaInicio / fechaFin (no van en el registro inicial)
   */
  private static toBackendRequest(data: NewApplicantFormData): RegistrarPostulanteRequest {
    const compania = (data.company?.trim().toUpperCase() || 'ALBRU') as 'ALBRU' | 'WIN' | 'CLARO';
    const origen = data.campaign.trim().toUpperCase() as 'COMPUTRABAJO' | 'INDEED' | 'REFERIDO';
    const puestoTrabajo = data.positionOfInterest.trim().replace(/\s+/g, '_').toUpperCase();

    return {
      nombres: data.nombres.trim(),
      apellidos: data.apellidos.trim(),
      tipoDocumento: data.documentType as 'DNI' | 'CE',
      numeroDocumento: data.documentNumber.trim(),
      celularPersonal: data.phoneMobile.trim(),
      compania,
      origen,
      puestoTrabajo,
    };
  }
}