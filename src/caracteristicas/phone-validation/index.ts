/**
 * Phone Validation Feature - Barril de exportación pública
 * 
 * Regla FSD: Solo exporta lo necesario para consumidores externos
 * - Hook: usePhoneValidation
 * - Componentes: PhoneInput, PhoneNumberInput, PhoneValidationResult
 * - Tipos: NumverifyResponse, PhoneValidationResult
 * 
 * Consumidores (pages, widgets) importan desde @caracteristicas/phone-validation
 */

export { usePhoneValidation } from './model';
export type {
  NumverifyResponse,
  PhoneValidationResult as PhoneValidationResultType,
  UsePhoneValidationOptions,
  UsePhoneValidationReturn,
} from './model';

export {
  PhoneInput,
  PhoneNumberInput,
  PhoneValidationResult,
} from './ui';

export type {
  PhoneInputProps,
  PhoneNumberInputProps,
  PhoneValidationResultProps,
} from './ui';
