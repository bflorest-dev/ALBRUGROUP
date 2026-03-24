/**
 * Configuración de validación de teléfonos por país
 * Define la cantidad de dígitos permitidos para cada país
 */

export const PHONE_LENGTH_BY_COUNTRY: Record<string, { minLength: number; maxLength: number }> = {
  '.pe': { minLength: 9, maxLength: 9 },      // Perú: 9 dígitos
  '.mx': { minLength: 10, maxLength: 10 },    // México: 10 dígitos
  '.co': { minLength: 10, maxLength: 10 },    // Colombia: 10 dígitos
  '.cl': { minLength: 9, maxLength: 9 },      // Chile: 9 dígitos
  '.ar': { minLength: 10, maxLength: 10 },    // Argentina: 10 dígitos
  '.br': { minLength: 11, maxLength: 11 },    // Brasil: 11 dígitos (2 área + 9)
  '.ve': { minLength: 10, maxLength: 11 },    // Venezuela: 10-11 dígitos
  '.ec': { minLength: 10, maxLength: 10 },    // Ecuador: 10 dígitos
  '.bo': { minLength: 8, maxLength: 9 },      // Bolivia: 8-9 dígitos
  '.py': { minLength: 9, maxLength: 10 },     // Paraguay: 9-10 dígitos
  '.uy': { minLength: 8, maxLength: 9 },      // Uruguay: 8-9 dígitos
  '.gt': { minLength: 8, maxLength: 8 },      // Guatemala: 8 dígitos
  '.sv': { minLength: 8, maxLength: 8 },      // El Salvador: 8 dígitos
  '.hn': { minLength: 8, maxLength: 8 },      // Honduras: 8 dígitos
  '.ni': { minLength: 8, maxLength: 8 },      // Nicaragua: 8 dígitos
  '.cr': { minLength: 8, maxLength: 8 },      // Costa Rica: 8 dígitos
  '.pa': { minLength: 6, maxLength: 8 },      // Panamá: 6-8 dígitos
  '.do': { minLength: 10, maxLength: 10 },    // República Dominicana: 10 dígitos
  '.cu': { minLength: 8, maxLength: 8 },      // Cuba: 8 dígitos
  '.es': { minLength: 9, maxLength: 9 },      // España: 9 dígitos
};

/**
 * Valida el número de teléfono según el país
 * @param value - El valor del teléfono
 * @param country - El código del país (ej: '.pe', '.mx', etc.)
 * @returns true si el valor es válido para el país
 */
export const isValidPhoneForCountry = (value: string, country: string): boolean => {
  if (!country || !value) return true; // Si no hay país seleccionado, permitir cualquier valor

  const config = PHONE_LENGTH_BY_COUNTRY[country];
  if (!config) return true;

  const length = value.length;
  return length >= config.minLength && length <= config.maxLength;
};

/**
 * Filtra el input para permitir solo números
 * @param value - El valor del input
 * @param country - El código del país (ej: '.pe', '.mx', etc.)
 * @returns El valor filtrado con solo números de acuerdo con la longitud máxima del país
 */
export const filterPhoneInput = (value: string, country: string): string => {
  // Permitir solo números
  const numericValue = value.replace(/\D/g, '');

  if (!country) return numericValue;

  // Limitar a la longitud máxima del país
  const config = PHONE_LENGTH_BY_COUNTRY[country];
  if (config) {
    return numericValue.slice(0, config.maxLength);
  }

  return numericValue;
};

/**
 * Obtiene el mensaje de validación para un país
 * @param country - El código del país
 * @returns El mensaje de validación a mostrar al usuario
 */
export const getPhoneValidationMessage = (country: string): string => {
  const config = PHONE_LENGTH_BY_COUNTRY[country];
  if (!config) return 'Solo números';

  if (config.minLength === config.maxLength) {
    return `${config.maxLength} dígitos`;
  }

  return `${config.minLength}-${config.maxLength} dígitos`;
};
