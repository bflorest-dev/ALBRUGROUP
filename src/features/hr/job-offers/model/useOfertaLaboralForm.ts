/**
 * Hook para Formulario de Oferta Laboral
 * Integra React Hook Form + Zod validation
 */

import { useCallback, useEffect } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ============================================================================
// VALIDACIÓN CON ZOD
// ============================================================================

export const ofertaLaboralSchema = z.object({
  codigo: z
    .string()
    .min(1, 'El código es requerido')
    .regex(/^OF-\d{6}-\d{5}$/, 'Formato de código inválido (OF-YYYYMM-NNNNN)'),

  negocio: z
    .enum(['FIBRA_MIXTO', 'CLARO'] as const)
    .refine((val) => val, { message: 'Selecciona un negocio válido' }),

  puestoObjetivo: z
    .enum(
      [
        'RRHH',
        'RECLUTADOR',
        'CAPACITADOR',
        'DESARROLLADOR',
        'CONTADOR',
        'COMMUNITY',
        'MONITOR',
        'SUPERVISOR_VENTAS',
        'ASESOR_VENTAS',
        'SUPERVISOR_BACKOFFICE',
        'ASESOR_BACKOFFICE',
        'SUPERVISOR_GTR',
        'ASESOR_GTR',
        'SUPERVISOR_POSTVENTA',
        'ASESOR_POSTVENTA',
      ] as const
    )
    .refine((val) => val, { message: 'Selecciona un puesto válido' }),

  horario: z
    .enum(['MORNING', 'AFTERNOON'] as const)
    .refine((val) => val, { message: 'Selecciona un horario válido' }),

  modalidad: z
    .enum(['PART_TIME', 'FULL_TIME', 'SEMI_FULL', 'SUPER_FULL'] as const)
    .refine((val) => val, { message: 'Selecciona una modalidad válida' }),

  cantidadInicial: z
    .number()
    .int('La cantidad debe ser un número entero')
    .min(1, 'La cantidad debe ser mayor a 0'),

  plazoInicial: z
    .string()
    .refine((value) => {
      const isoFormat = /^\d{4}-\d{2}-\d{2}$/;
      const ddmmyyyyFormat = /^\d{2}-\d{2}-\d{4}$/;
      if (!isoFormat.test(value) && !ddmmyyyyFormat.test(value)) {
        return false;
      }
      const normalized = ddmmyyyyFormat.test(value)
        ? `${value.slice(6)}-${value.slice(3, 5)}-${value.slice(0, 2)}`
        : value;
      return !Number.isNaN(new Date(normalized).getTime());
    }, { message: 'Debe ser una fecha válida (DD-MM-YYYY o YYYY-MM-DD)' }),
    // .refine(
    //   (date) => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)),
    //   'La fecha debe ser hoy o en el futuro'
    // ),
});

export type OfertaLaboralFormData = z.infer<typeof ofertaLaboralSchema>;

// ============================================================================
// TIPOS DEL HOOK
// ============================================================================

export interface UseOfertaLaboralFormOptions {
  onSuccess?: (id: number) => void;
  onError?: (error: Error) => void;
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Generar código automáticamente: OF-YYYYMM-NNNNN
 * Ejemplos: OF-202501-00001, OF-202501-00002
 */
function generarCodigoOferta(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const numero = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
  return `OF-${year}${month}-${numero}`;
}

// ============================================================================
// HOOK
// ============================================================================

export type UseOfertaLaboralFormReturn = UseFormReturn<OfertaLaboralFormData> & {
  isLoading: boolean;
  regenerateCodigo: () => void;
};

/**
 * Hook para manejar el formulario de oferta laboral
 * - Auto-genera código con patrón OF-YYYYMM-NNNNN
 * - Valida con Zod
 * - Maneja carga/errores
 */
export function useOfertaLaboralForm(): UseOfertaLaboralFormReturn {
  const {
    register,
    handleSubmit,
    formState,
    watch,
    setValue,
    reset,
  } = useForm<OfertaLaboralFormData>({
    resolver: zodResolver(ofertaLaboralSchema),
    defaultValues: {
      codigo: '',
      negocio: 'FIBRA_MIXTO',
      puestoObjetivo: 'RRHH',
      horario: 'MORNING',
      modalidad: 'FULL_TIME',
      cantidadInicial: 1,
      plazoInicial: '',
    },
  });

  const isLoading = formState.isSubmitting;

  const regenerateCodigo = useCallback(() => {
    const newCodigo = generarCodigoOferta();
    setValue('codigo', newCodigo);
  }, [setValue]);

  // Auto-generar código al montar
  useEffect(() => {
    regenerateCodigo();
  }, [regenerateCodigo]);

  return {
    register,
    handleSubmit,
    formState,
    watch,
    setValue,
    reset,
    isLoading,
    regenerateCodigo,
  } as UseOfertaLaboralFormReturn;
}
