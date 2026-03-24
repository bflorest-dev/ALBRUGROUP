// Utilidades
export { isValidPhoneForCountry, filterPhoneInput, getPhoneValidationMessage, PHONE_LENGTH_BY_COUNTRY } from './validacionTelefono';
export { sanitizeInput, sanitizeEmail, sanitizePhone, sanitizeName, escapeHtml, sanitizeUrl } from './sanitizacion';
export { sanitizeFormField } from '../../utils/sanitization';
export { loadApplicantsFromStorage, saveApplicantsToStorage, loadEmployeesFromStorage, saveEmployeesToStorage, clearAllStorage } from './almacenamientoLocal';

// Constantes de estado y posiciones (desde utils)
export { EMPLOYEE_STATUS_COLORS, EMPLOYEE_STATUS_BG_COLORS, POSITIONS_WITH_COMPANY } from '../../utils/constants';
export { AVAILABLE_POSITIONS_GROUPED, AVAILABLE_POSITIONS } from '../../utils/mockData';
export { TIPIFICATION_BLOCKS } from '../../utils/tipificationConstants';

// Feature Error Boundary
export { FeatureErrorBoundary, type FeatureErrorBoundaryProps, type FeatureErrorBoundaryState } from '../ui/limitadorErrores/FeatureErrorBoundary';

// Error handling utilities
export { createError } from '../../hooks/useErrorHandler';
export const getSafeErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Occurred an unexpected error';
};
export const SafeErrorMessages = {
  UNKNOWN: 'An unexpected error occurred',
  NETWORK: 'Network error. Please check your connection',
  VALIDATION: 'Validation error. Please check your data',
};

// Contextos
export * from '../../contexts/ApplicantsContext';
export * from '../../contexts/DevRoleContext';
export * from '../../contexts/NotificationContext';
export * from '../../contexts/SidebarContext';
export { useNotification } from '../../contexts/useNotification';

// Servicios/ErrorLogger
export * from '../../services/index';
