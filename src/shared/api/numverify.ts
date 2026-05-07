/**
 * Numverify API Client
 * Centraliza la configuración y la llamada a Numverify
 * 
 * Requisitos:
 * - Agregar VITE_NUMVERIFY_ACCESS_KEY a .env
 * - Documentar que la clave debe venir del panel de Numverify (http://apilayer.net/)
 */

const BASE_URL = 'https://apilayer.net/api';

export const getNumverifyAccessKey = (): string => {
  const key = import.meta.env.VITE_NUMVERIFY_ACCESS_KEY;
  if (!key) {
    throw new Error(
      'VITE_NUMVERIFY_ACCESS_KEY no está definida en .env. ' +
      'Por favor, agrega la clave en tu archivo .env.'
    );
  }
  return key;
};

export interface ValidatePhoneParams {
  number: string;
  countryCode?: string; // Código ISO 3166-1 alpha-2 (e.g., 'US', 'ES')
}

/**
 * Valida un número telefónico usando la API de Numverify
 * @param number - Número a validar (con o sin el símbolo "+")
 * @param countryCode - Código de país opcional (ISO 3166-1 alpha-2)
 * @returns Promise con los datos de validación
 */
export async function validatePhoneNumber(
  params: ValidatePhoneParams
): Promise<Response> {
  const accessKey = getNumverifyAccessKey();

  const queryParams = new URLSearchParams({
    access_key: accessKey,
    number: params.number,
  });

  if (params.countryCode) {
    queryParams.append('country_code', params.countryCode);
  }

  const url = `${BASE_URL}/validate?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    return response;
  } catch (error) {
    throw new Error(
      `Error validating phone number: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
