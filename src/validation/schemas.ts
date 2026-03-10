/**
 * Esquemas de Validación con Zod
 * Centraliza todas las validaciones del formulario
 * Proporciona type inference automático para seguridad de tipos
 */

import { z, type ZodIssue } from 'zod';

/**
 * Esquema para validación de documentos (DNI, CE, etc)
 */
export const DocumentSchema = z.enum(['DNI', 'CE']);

/**
 * Esquema base para datos personales
 * Usado en múltiples formularios
 */
const PersonalDataSchema = z.object({
  nombres: z
    .string()
    .min(1, 'Los nombres son requeridos')
    .min(3, 'Los nombres deben tener al menos 3 caracteres')
    .max(100, 'Los nombres no pueden exceder 100 caracteres')
    .trim(),
  apellidos: z
    .string()
    .min(1, 'Los apellidos son requeridos')
    .min(3, 'Los apellidos deben tener al menos 3 caracteres')
    .max(100, 'Los apellidos no pueden exceder 100 caracteres')
    .trim(),
  documentType: DocumentSchema,
  documentNumber: z
    .string()
    .min(1, 'El número de documento es requerido')
    .min(8, 'El número de documento debe tener al menos 8 caracteres')
    .max(20, 'El número de documento no puede exceder 20 caracteres')
    .regex(/^[0-9]+$/, 'El número de documento solo debe contener dígitos')
    .trim(),
  phoneMobile: z
    .string()
    .min(1, 'El número de celular es requerido')
    .min(7, 'El número de celular debe tener al menos 7 dígitos')
    .max(15, 'El número de celular no puede exceder 15 dígitos')
    .regex(/^[0-9+\-\s()]+$/, 'Formato de celular inválido')
    .trim(),
});

/**
 * Esquema para crear un nuevo empleado
 */
export const NewEmployeeFormDataSchema = PersonalDataSchema.extend({
  nationality: z
    .string()
    .min(1, 'La nacionalidad es requerida')
    .max(50, 'La nacionalidad no puede exceder 50 caracteres'),
  birthDate: z
    .string()
    .date('La fecha de nacimiento debe ser una fecha válida'),
  civilStatus: z
    .string()
    .min(1, 'El estado civil es requerido'),
  hasChildren: z.boolean(),
  district: z
    .string()
    .min(1, 'El distrito es requerido'),
  address: z
    .string()
    .min(1, 'La dirección es requerida')
    .max(200, 'La dirección no puede exceder 200 caracteres')
    .trim(),
  bank: z
    .string()
    .min(1, 'El banco es requerido'),
  accountNumber: z
    .string()
    .min(1, 'El número de cuenta es requerido')
    .regex(/^[0-9]+$/, 'El número de cuenta solo debe contener dígitos')
    .trim(),
  interbankNumber: z
    .string()
    .min(1, 'El código interbancario es requerido'),
  baseSalary: z
    .string()
    .min(1, 'El salario base es requerido')
    .regex(/^[0-9]+([.,][0-9]{1,2})?$/, 'El salario debe ser un número válido'),
  role: z
    .string()
    .min(1, 'El rol es requerido'),
  company: z
    .string()
    .max(100, 'La compañía no puede exceder 100 caracteres')
    .optional(),
  startDate: z
    .string()
    .date('La fecha de inicio debe ser una fecha válida'),
  endDate: z
    .string()
    .date('La fecha de fin debe ser una fecha válida')
    .optional(),
  modality: z
    .string()
    .min(1, 'La modalidad es requerida'),
  scheduleType: z
    .string()
    .min(1, 'El tipo de horario es requerido'),
  personalEmail: z
    .string()
    .email('El correo personal debe ser un email válido')
    .max(100, 'El email no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  campaign: z
    .string()
    .optional(),
  // contract-only fields
  regimen: z.string().optional(),
  seguro: z.string().optional(),
  pension: z.string().optional(),
  contractOwnAccount: z.string().optional(),
  contractKinship: z.string().optional(),
  contractCellularTransfer: z.string().optional(),
  contractorCompany: z.string().optional(),
});

/**
 * Tipo inferido automáticamente de Zod
 * Garantiza que el tipo siempre coincida con el esquema
 */
export type NewEmployeeFormDataType = z.infer<typeof NewEmployeeFormDataSchema>;

/**
 * Esquema para crear un nuevo postulante
 * Más simple que empleado
 */
export const NewApplicantFormDataSchema = PersonalDataSchema.extend({
  positionOfInterest: z
    .string()
    .min(1, 'La posición de interés es requerida')
    .max(100, 'La posición no puede exceder 100 caracteres'),
  company: z
    .string()
    .max(100, 'La compañía no puede exceder 100 caracteres')
    .optional(),
  campaign: z
    .string()
    .min(1, 'La campaña/origen es requerida')
    .max(100, 'La campaña no puede exceder 100 caracteres'),
});

export type NewApplicantFormDataType = z.infer<typeof NewApplicantFormDataSchema>;

/**
 * Esquema para login
 */
export const LoginFormSchema = z.object({
  email: z
    .string()
    .email('El email debe ser válido')
    .min(1, 'El email es requerido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .min(1, 'La contraseña es requerida'),
});

export type LoginFormDataType = z.infer<typeof LoginFormSchema>;

/**
 * Esquema para búsqueda/filtros (parcial, todos los campos opcionales)
 */
export const EmployeeFilterSchema = z.object({
  q: z.string().optional(),
  dni: z.string().optional(),
  celular: z.string().optional(),
  distrito: z.string().optional(),
  banco: z.string().optional(),
  estado: z.string().optional(),
});

export type EmployeeFilterType = z.infer<typeof EmployeeFilterSchema>;

/**
 * Utilidades para validación
 */

/**
 * Valida datos contra un esquema y retorna el resultado
 * Si hay errores, retorna objeto con errores formateados
 * 
 * @param schema Esquema de Zod
 * @param data Datos a validar
 * @returns {success: true, data} o {success: false, errors}
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue: ZodIssue) => {
    const path = issue.path.join('.');
    if (path) {
      errors[path] = issue.message;
    }
  });

  return { success: false, errors };
}

/**
 * Valida datos y lanza error si hay problemas
 * Útil para servicios que quieren error handling explícito
 * 
 * @param schema Esquema de Zod
 * @param data Datos a validar
 * @throws Error si la validación falla
 */
export function validateDataOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const messages = result.error.issues
      .map((err: ZodIssue) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    throw new Error(`Validación fallida: ${messages}`);
  }

  return result.data;
}

/**
 * Transforma y valida datos en un paso
 * Útil para formularios que necesitan normalización
 * 
 * @param schema Esquema de Zod
 * @param data Datos a transformar y validar
 * @returns Datos validados y transformados
 */
export function parseAndTransform<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  return schema.parse(data);
}
