/**
 * Mapper para Registrar Postulante
 * 
 * Convierte NewApplicantFormData (UI) → RegistrarPostulanteRequest (Backend DTO)
 * 
 * FSD Layer: features/registrar-postulante/model/mappers
 */

import type { NewApplicantFormData } from '@shared/types';
import type { RegistrarPostulanteRequest } from '@shared/types';
import { DocumentoEnum, PuestoTrabajoEnum, OrigenEnum, CompaniaEnum } from '@shared/types';
import { validateEnumValue } from '@shared/utils/enumValidator';

export function mapFormToRegistrarPostulanteRequest(
  formData: NewApplicantFormData
): RegistrarPostulanteRequest {
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
  if (!formData.positionOfInterest?.trim()) {
    throw new Error('Puesto de interés es requerido');
  }
  if (!formData.campaign?.trim()) {
    throw new Error('Campaña es requerida');
  }

  // Validar enums
  validateEnumValue(DocumentoEnum, formData.documentType, 'Tipo de documento');
  validateEnumValue(PuestoTrabajoEnum, formData.positionOfInterest, 'Puesto de interés');
  validateEnumValue(OrigenEnum, formData.campaign, 'Campaña/Origen');

  if (formData.company) {
    validateEnumValue(CompaniaEnum, formData.company, 'Compañía');
  }

  // Mapeo explícito: UI → Backend DTO
  return {
    // Datos personales (requeridos)
    nombres: formData.nombres.trim(),
    apellidos: formData.apellidos.trim(),
    tipoDocumento: (formData.documentType as 'DNI' | 'CE'),
    numeroDocumento: formData.documentNumber?.trim() || '',

    // Contacto
    phoneMobile: formData.phoneMobile.trim(),
    email: formData.email?.trim(),

    // Laboral (requerido)
    puestoTrabajo: (formData.positionOfInterest as string),
    compania: formData.company ? (formData.company as 'ALBRU' | 'WIN' | 'CLARO') : undefined,

    // Origen/Campaña (requerido)
    origen: (formData.campaign as string),
  };
}
