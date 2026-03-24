/**
 * Hook: useLeadSubmit
 * Maneja el envío de formulario con estados de loading y error
 */

import { useState, useCallback } from 'react';
import type { NewLeadFormData } from './useNewLeadForm';
import { getSafeErrorMessage, SafeErrorMessages } from '@compartido/lib';

export interface UseLeadSubmitState {
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;
}

export interface UseLeadSubmitActions {
  submit: (data: NewLeadFormData) => Promise<boolean>;
  resetSubmitState: () => void;
}

/**
 * Hook para manejar el envío de formularios con feedback al usuario
 * 
 * Funcionalidad:
 * - Mantiene estado de la operación: submitting, error, success
 * - Deshabilita botón durante envío (previene doble click)
 * - Captura y formatea errores del servidor
 * - Proporciona estados para mostrar feedback visual
 * 
 * Estados:
 * - Inicial: isSubmitting=false, submitError=null, submitSuccess=false
 * - Enviando: isSubmitting=true
 * - Error: isSubmitting=false, submitError="Mensaje", retorna false
 * - Éxito: isSubmitting=false, submitSuccess=true, retorna true
 * 
 * Comportamiento:
 * - Simula delay de 1.5 segundos para representar latencia de red
 * - Tiene 20% de probabilidad de error para testing
 * - El resetSubmitState limpia todos los estados
 * 
 * TODO: Reemplazar simulación con llamada a API real (LeadService.create(data))
 * 
 * @returns UseLeadSubmitState & UseLeadSubmitActions:
 *   - isSubmitting: true mientras se envía
 *   - submitError: Mensaje de error o null
 *   - submitSuccess: true si fue exitoso
 *   - submit: Función async que retorna boolean (true=éxito, false=error)
 *   - resetSubmitState: Resetea todos los estados al inicial
 * 
 * @example
 * const { isSubmitting, submitError, submit, resetSubmitState } = useLeadSubmit();
 * 
 * const handleSubmit = async (data) => {
 *   const success = await submit(data);
 *   if (success) {
 *     toast.success('Lead creado');
 *     closeModal();
 *   }
 * };
 * 
 * return (
 *   <form onSubmit={handleSubmit}>
 *     {submitError && <Alert>{submitError}</Alert>}
 *     <Button disabled={isSubmitting} type="submit">
 *       {isSubmitting ? 'Creando...' : 'Crear'}
 *     </Button>
 *   </form>
 * );
 */
export const useLeadSubmit = (): UseLeadSubmitState & UseLeadSubmitActions => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  /**
   * Enviar nuevo lead
   * Simula envío a servidor - reemplazar con llamada API real
   * 
   * SEGURIDAD:
   * - Valida datos antes de enviar
   * - Usa manejo seguro de errores (no expone detalles internos)
   * - Limpia estado previo antes de nuevos envíos
   * - En caso de error, muestra mensaje user-friendly
   */
  const submit = useCallback(async (data: NewLeadFormData): Promise<boolean> => {
    // SEGURIDAD: Validar que data no sea undefined/null
    if (!data || Object.keys(data).length === 0) {
      setSubmitError(SafeErrorMessages.INVALID_INPUT);
      return false;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // TODO: Reemplazar simulación con llamada a API real
      // const response = await LeadService.create(data);
      // if (!response.ok) throw new Error(response.message);

      // Simulación: esperar 1.5 segundos
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simular error aleatorio (20% de probabilidad) para testing
      if (Math.random() < 0.2) {
        // En API real, retornaría error específico del servidor
        throw new Error('Validation Error: Lead data rejected');
      }

      setSubmitSuccess(true);
      return true;
    } catch (err) {
      // SEGURIDAD: Usar manejo seguro de errores
      const safeErrorMessage = getSafeErrorMessage(
        err,
        SafeErrorMessages.CREATE_FAILED
      );

      setSubmitError(safeErrorMessage);

      // En desarrollo, loguear error completo
      if (import.meta.env.DEV) {
        console.warn('[useLeadSubmit] Error details:', err);
      }

      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  /**
   * Resetear estado de envío
   */
  const resetSubmitState = useCallback(() => {
    setIsSubmitting(false);
    setSubmitError(null);
    setSubmitSuccess(false);
  }, []);

  return {
    isSubmitting,
    submitError,
    submitSuccess,
    submit,
    resetSubmitState,
  };
};
