/**
 * Exports de model (types, hooks)
 */

export { usePhoneValidation } from './usePhoneValidation';
export type {
  UsePhoneValidationOptions,
  UsePhoneValidationReturn,
} from './usePhoneValidation';

export type {
  NumverifyResponse,
  NumverifyErrorResponse,
  PhoneValidationState,
  PhoneValidationResult,
} from './types';

export {
  COUNTRIES,
  getCountryByCode,
  getCountryByPrefix,
  getCountryOptions,
} from './countries';
export type { CountryPrefix } from './countries';
