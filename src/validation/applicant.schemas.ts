import { z } from 'zod';
import { POSITIONS_WITH_COMPANY } from '../utils/constants';
import { AVAILABLE_POSITIONS_GROUPED } from '../utils/mockData';

/**
 * Extrae todas las posiciones disponibles del objeto agrupado
 */
const availablePositions = Object.values(AVAILABLE_POSITIONS_GROUPED)
  .flat()
  .filter((pos) => pos !== 'ADMINISTRADOR');

/**
 * Schema de validación para datos de postulante
 * Usado en formularios de creación y edición
 */
export const newApplicantFormDataSchema = z
  .object({
    nombres: z
      .string()
      .min(1, 'El nombre es requerido')
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres'),

    apellidos: z
      .string()
      .min(1, 'El apellido es requerido')
      .min(2, 'El apellido debe tener al menos 2 caracteres')
      .max(100, 'El apellido no puede exceder 100 caracteres'),

    phoneMobile: z
      .string()
      .min(1, 'El teléfono es requerido')
      .regex(/^\d{7,}$/, 'El teléfono debe tener al menos 7 dígitos'),

    documentType: z.enum(['DNI', 'CE']),

    documentNumber: z
      .string()
      .min(1, 'El número de documento es requerido')
      .min(6, 'El número de documento debe tener al menos 6 caracteres')
      .max(15, 'El número de documento no puede exceder 15 caracteres'),

    positionOfInterest: z
      .string()
      .min(1, 'El puesto de interés es requerido')
      .refine(
        (pos) => availablePositions.includes(pos),
        'El puesto seleccionado no es válido'
      ),

    campaign: z
      .string()
      .min(1, 'La campaña es requerida')
      .refine(
        (camp) =>
          ['COMPUTRABAJO', 'INDEED', 'REFERIDO', 'TIKTOK', 'FACEBOOK', 'LINKEDIN'].includes(camp),
        'La campaña seleccionada no es válida'
      ),

    company: z.string().optional(),
  })
  .refine(
    (data) => {
      // Si la posición requiere empresa, validar que esté presente y no vacía
      if (POSITIONS_WITH_COMPANY.includes(data.positionOfInterest)) {
        return !!data.company && data.company.trim().length > 0;
      }
      return true;
    },
    {
      message: 'La compañía es requerida para este puesto',
      path: ['company'],
    }
  )
  .refine(
    (data) => {
      // Si la compañía está presente, validar que sea una opción válida
      if (data.company && data.company.trim().length > 0) {
        return ['CLARO', 'WIN'].includes(data.company);
      }
      return true;
    },
    {
      message: 'La compañía seleccionada no es válida',
      path: ['company'],
    }
  );

/**
 * Schema para edición de postulante (incluye ID)
 */
export const editApplicantFormDataSchema = newApplicantFormDataSchema.extend({
  id: z.string().min(1, 'El ID del postulante es requerido'),
});

/**
 * Tipos inferred desde los schemas
 */
export type NewApplicantFormDataType = z.infer<typeof newApplicantFormDataSchema>;
export type EditApplicantFormDataType = z.infer<typeof editApplicantFormDataSchema>;

/**
 * Mapa de campos a labels para mensajes de error más amigables
 * Útil para mostrar errores contextualizados en la UI
 */
export const applicantFormFieldLabels: Record<string, string> = {
  nombres: 'Nombres',
  apellidos: 'Apellidos',
  phoneMobile: 'Celular',
  documentType: 'Tipo de Documento',
  documentNumber: 'Número de Documento',
  positionOfInterest: 'Puesto de Interés',
  campaign: 'Campaña',
  company: 'Compañía',
};
