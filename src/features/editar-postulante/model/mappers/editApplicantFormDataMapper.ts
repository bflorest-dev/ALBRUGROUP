/**
 * Mapper para Editar Postulante
 * 
 * Convierte EditApplicantFormData (UI) → ActualizarPostulanteRequest (Backend DTO)
 * 
 * FSD Layer: features/editar-postulante/model/mappers
 */

import type { NewApplicantFormData } from '@shared/types';
import { DocumentoEnum, PuestoTrabajoEnum, CompaniaEnum } from '@shared/types';
import { validateEnumValue, isValidEnumValue } from '@shared/utils/enumValidator';

export interface ActualizarPostulanteRequest {
  nombres: string;
  apellidos: string;
  email?: string;
  phoneMobile: string;
  tipoDocumento?: 'DNI' | 'CE';
  numeroDocumento?: string;
  puestoTrabajo?: string;
  compania?: string;
}

export function mapFormToActualizarPostulanteRequest(
  formData: NewApplicantFormData
): ActualizarPostulanteRequest {
  // Validar campos críticos
  if (!formData.nombres?.trim()) {
    throw new Error('Nombres es requerido');
  }
  if (!formData.apellidos?.trim()) {
    throw new Error('Apellidos es requerido');
  }
  if (!formData.phoneMobile?.trim()) {
    throw new Error('Teléfono móvil es requerido');
  }

  // Validar enums si están presentes
  if (formData.documentType && !isValidEnumValue(DocumentoEnum, formData.documentType)) {
    throw new Error(`Tipo de documento inválido: ${formData.documentType}`);
  }

  if (formData.positionOfInterest && !isValidEnumValue(PuestoTrabajoEnum, formData.positionOfInterest)) {
    throw new Error(`Puesto de interés inválido: ${formData.positionOfInterest}`);
  }

  if (formData.company && !isValidEnumValue(CompaniaEnum, formData.company)) {
    throw new Error(`Compañía inválida: ${formData.company}`);
  }

  // Mapeo explícito
  return {
    // Datos personales
    nombres: formData.nombres.trim(),
    apellidos: formData.apellidos.trim(),
    tipoDocumento: formData.documentType as 'DNI' | 'CE',
    numeroDocumento: formData.documentNumber?.trim(),

    // Contacto
    phoneMobile: formData.phoneMobile.trim(),
    email: formData.email?.trim(),

    // Laboral
    puestoTrabajo: formData.positionOfInterest?.trim(),
    compania: formData.company?.trim(),
  };
}
