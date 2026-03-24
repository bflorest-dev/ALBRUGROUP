// Re-exportar utilidades desde src/utils
export { EMPLOYEE_STATUS_COLORS, EMPLOYEE_STATUS_BG_COLORS } from '../../utils/constants';
export { POSITIONS_WITH_COMPANY } from '../../utils/constants';
// AVAILABLE_POSITIONS_GROUPED está en mockData, no en constants - re-exportado en index.ts
export { AVAILABLE_POSITIONS } from '../../utils/mockData';
export { filterPhoneInput } from '../../utils/phoneValidation';
export { sanitizeInput, sanitizeFormField } from '../../utils/sanitization';
export { getSafeErrorMessage, SafeErrorMessages } from '../../utils/secureErrorHandling';
