/**
 * Tipos para Phone Validation Feature
 * Interfaz de respuesta de Numverify API
 */

export interface NumverifyResponse {
  valid: boolean;
  number: string;
  local_format: string;
  international_format: string;
  country_prefix: string;
  country_code: string;
  country_name: string;
  location: string;
  carrier: string;
  line_type: string;
}

export interface NumverifyErrorResponse {
  success: false;
  error: {
    code: number;
    type: string;
    info: string;
  };
}

export interface PhoneValidationState {
  data: NumverifyResponse | null;
  loading: boolean;
  error: string | null;
}

export interface PhoneValidationResult {
  isValid: boolean;
  phoneNumber: string;
  countryPrefix: string;
  countryName: string;
  carrier?: string;
  lineType?: string;
  localFormat: string;
  internationalFormat: string;
}
