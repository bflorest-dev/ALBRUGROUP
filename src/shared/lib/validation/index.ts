/**
 * Validation Module
 *
 * Centraliza todas las funciones de validación y schemas Zod
 * Exporta tanto helpers de validación como los schemas disponibles
 */

import { ZodSchema, ZodError } from 'zod';

/**
 * Valida datos contra un schema Zod y lanza error si falla
 *
 * @param schema - Schema Zod a usar para validación
 * @param data - Datos a validar
 * @returns Datos validados y tipados
 * @throws Error con mensaje descriptivo si validación falla
 */
export function validateDataOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      // Formatea los errores de Zod en un mensaje legible
      const messages = error.issues
        .map((err) => {
          const path = Array.isArray(err.path) ? err.path.filter((item): item is string | number => typeof item === 'string' || typeof item === 'number') : [];
          return `${path.join('.')}: ${err.message}`;
        })
        .join('; ');
      throw new Error(`Validación fallida: ${messages}`);
    }
    throw error;
  }
}

/**
 * Re-exporta aplicant schemas con alias en CamelCase para importaciones simplificadas
 */
export {
  newApplicantFormDataSchema as NewApplicantFormDataSchema,
  editApplicantFormDataSchema as EditApplicantFormDataSchema,
  type NewApplicantFormDataType,
  type EditApplicantFormDataType,
  applicantFormFieldLabels,
} from './applicant.schemas';

/**
 * Re-exporta employee schemas (to be created if needed)
 */
export {
  newEmployeeFormDataSchema as NewEmployeeFormDataSchema,
  editEmployeeFormDataSchema as EditEmployeeFormDataSchema,
  type NewEmployeeFormDataType,
  type EditEmployeeFormDataType,
} from './employee.schemas';

/**
 * Export all typed schemas for direct access
 */
export * from './applicant.schemas';
