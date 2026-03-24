/**
 * useTipification - Hook personalizado
 * 
 * Gestiona la lógica de tipificación:
 * - Selección de bloque y opción
 * - Validación de campos requeridos (fecha, notas)
 * - Guardado de tipificación
 */

import { useState, useCallback } from 'react';
import type { TipificationOptionId } from '@compartido/tipos/tipification.types';

/**
 * Estado del hook
 */
interface TipificationState {
  selectedBlockId: string | null;
  selectedOptionId: TipificationOptionId | null;
  scheduledDate?: string;
  notes?: string;
  isSubmitting: boolean;
  error: string | null;
}

/**
 * Respuesta del hook
 */
interface UseTipificationReturn extends TipificationState {
  selectBlock: (blockId: string) => void;
  selectOption: (optionId: TipificationOptionId) => void;
  setScheduledDate: (date: string) => void;
  setNotes: (notes: string) => void;
  clear: () => void;
  isValid: () => boolean;
  submit: (onSubmit: (data: TipificationState) => Promise<void>) => Promise<void>;
}

/**
 * Hook: useTipification
 * 
 * Gestiona estado y lógica de tipificación
 */
export const useTipification = (): UseTipificationReturn => {
  const [state, setState] = useState<TipificationState>({
    selectedBlockId: null,
    selectedOptionId: null,
    scheduledDate: undefined,
    notes: undefined,
    isSubmitting: false,
    error: null
  });

  // Seleccionar bloque (limpia la opción anterior)
  const selectBlock = useCallback((blockId: string) => {
    setState((prev) => ({
      ...prev,
      selectedBlockId: blockId,
      selectedOptionId: null,
      error: null
    }));
  }, []);

  // Seleccionar opción dentro del bloque
  const selectOption = useCallback((optionId: TipificationOptionId) => {
    setState((prev) => ({
      ...prev,
      selectedOptionId: optionId,
      error: null
    }));
  }, []);

  // Establecer fecha
  const setScheduledDate = useCallback((date: string) => {
    setState((prev) => ({
      ...prev,
      scheduledDate: date
    }));
  }, []);

  // Establecer notas
  const setNotes = useCallback((notes: string) => {
    setState((prev) => ({
      ...prev,
      notes
    }));
  }, []);

  // Limpiar estado
  const clear = useCallback(() => {
    setState({
      selectedBlockId: null,
      selectedOptionId: null,
      scheduledDate: undefined,
      notes: undefined,
      isSubmitting: false,
      error: null
    });
  }, []);

  // Validar que sea completa
  const isValid = useCallback((): boolean => {
    return !!(state.selectedBlockId && state.selectedOptionId);
  }, [state.selectedBlockId, state.selectedOptionId]);

  // Enviar tipificación
  const submit = useCallback(
    async (onSubmit: (data: TipificationState) => Promise<void>) => {
      if (!isValid()) {
        setState((prev) => ({
          ...prev,
          error: 'Debe seleccionar una opción de tipificación'
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isSubmitting: true,
        error: null
      }));

      try {
        await onSubmit(state);
        clear();
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Error al guardar tipificación',
          isSubmitting: false
        }));
      }
    },
    [state, isValid, clear]
  );

  return {
    ...state,
    selectBlock,
    selectOption,
    setScheduledDate,
    setNotes,
    clear,
    isValid,
    submit
  };
};

export default useTipification;
