/**
 * Phone Validation API
 * Capa de abstracción para las llamadas a Numverify
 * 
 * Importa desde @shared/api (regla FSD: features puede importar de shared)
 */

import { validatePhoneNumber, type ValidatePhoneParams } from '@shared/api/numverify';
import type { NumverifyResponse, NumverifyErrorResponse } from '../model/types';

/**
 * Valida un número telefónico y devuelve los datos enriquecidos
 * @param params - Parámetros de validación (número, país opcional)
 * @returns NumverifyResponse o error
 * @throws Error si la validación falla
 */
export async function validatePhone(
  params: ValidatePhoneParams
): Promise<NumverifyResponse> {
  try {
    const response = await validatePhoneNumber(params);
    const data = (await response.json()) as
      | NumverifyResponse
      | NumverifyErrorResponse;

    // Validar respuesta de error de Numverify
    if ('error' in data && data.error) {
      throw new Error(
        `API Error: ${(data as NumverifyErrorResponse).error.info}`
      );
    }

    // Validar que sea respuesta exitosa
    if (!('valid' in data)) {
      throw new Error('Respuesta inesperada de Numverify');
    }

    return data as NumverifyResponse;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    throw new Error(`Falló la validación del número: ${errorMessage}`);
  }
}
