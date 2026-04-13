/**
 * Hook personalizado para validación de números telefónicos
 * 
 * Utiliza useState para gestionar loading, error y data
 * Proporciona función validate() para llamar manualmente a la API
 * 
 * Regla FSD: features puede usar React hooks y llamar a @shared o @features
 */

import { useState, useCallback } from 'react';
import { validatePhone } from '../api/phoneValidation.api';
import type {
  NumverifyResponse,
  PhoneValidationState,
  PhoneValidationResult,
} from './types';

export interface UsePhoneValidationOptions {
  onSuccess?: (result: PhoneValidationResult) => void;
  onError?: (error: string) => void;
}

export interface UsePhoneValidationReturn extends PhoneValidationState {
  validate: (phoneNumber: string, countryCode?: string) => Promise<void>;
  reset: () => void;
}

/**
 * Hook para validar números telefónicos
 * 
 * @example
 * const { data, loading, error, validate, reset } = usePhoneValidation();
 * 
 * const handleValidate = async () => {
 *   await validate('+34628123456');
 * };
 */
export function usePhoneValidation(
  options?: UsePhoneValidationOptions
): UsePhoneValidationReturn {
  const [state, setState] = useState<PhoneValidationState>({
    data: null,
    loading: false,
    error: null,
  });

  const validate = useCallback(
    async (phoneNumber: string, countryCode?: string) => {
      if (!phoneNumber.trim()) {
        setState((prev) => ({
          ...prev,
          error: 'Por favor, ingresa un número telefónico',
        }));
        return;
      }

      setState({ data: null, loading: true, error: null });

      try {
        const result = await validatePhone({
          number: phoneNumber,
          countryCode,
        });

        setState({
          data: result,
          loading: false,
          error: null,
        });

        // Callback de éxito
        if (options?.onSuccess && result.valid) {
          const phoneResult: PhoneValidationResult = {
            isValid: result.valid,
            phoneNumber: result.number,
            countryPrefix: result.country_prefix,
            countryName: result.country_name,
            carrier: result.carrier,
            lineType: result.line_type,
            localFormat: result.local_format,
            internationalFormat: result.international_format,
          };
          options.onSuccess(phoneResult);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error desconocido';

        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });

        // Callback de error
        if (options?.onError) {
          options.onError(errorMessage);
        }
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    validate,
    reset,
  };
}
