/**
 * Employee Form Schema
 *
 * Validación de datos para creación y edición de empleados
 */

import { z } from 'zod';
import { AVAILABLE_POSITIONS_GROUPED } from '@shared/utils/mockData';

// Extrae todas las posiciones disponibles
const availablePositions = Object.values(AVAILABLE_POSITIONS_GROUPED)
  .flat()
  .filter((pos) => pos !== 'ADMINISTRADOR');

/**
 * Schema de validación para datos de nuevo empleado
 * Usado en formulario de registro de empleado
 */
export const newEmployeeFormDataSchema = z
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

    email: z
      .string()
      .email('El email debe ser válido')
      .optional(),

    celular: z
      .string()
      .min(7, 'El celular debe tener al menos 7 dígitos')
      .optional(),

    numeroDocumento: z
      .string()
      .min(1, 'El número de documento es requerido')
      .min(6, 'El número debe tener al menos 6 caracteres')
      .max(15, 'El número no puede exceder 15 caracteres'),

    puesto: z
      .string()
      .min(1, 'El puesto es requerido')
      .refine(
        (pos) => availablePositions.includes(pos),
        'El puesto seleccionado no es válido'
      ),

    compania: z
      .string()
      .optional(),

    estado: z
      .string()
      .default('ACTIVO'),
  });

/**
 * Schema para edición de empleado (incluye ID)
 */
export const editEmployeeFormDataSchema = newEmployeeFormDataSchema.extend({
  id: z.string().min(1, 'El ID del empleado es requerido'),
});

/**
 * Tipos inferred desde los schemas
 */
export type NewEmployeeFormDataType = z.infer<typeof newEmployeeFormDataSchema>;
export type EditEmployeeFormDataType = z.infer<typeof editEmployeeFormDataSchema>;

/**
 * Mapa de campos a labels para mensajes de error
 */
export const employeeFormFieldLabels: Record<string, string> = {
  nombres: 'Nombres',
  apellidos: 'Apellidos',
  email: 'Email',
  celular: 'Celular',
  numeroDocumento: 'Número de Documento',
  puesto: 'Puesto',
  compania: 'Compañía',
  estado: 'Estado',
};
