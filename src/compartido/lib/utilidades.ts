// Re-exportar utilidades desde src/utils
export { EMPLOYEE_STATUS_COLORS, EMPLOYEE_STATUS_BG_COLORS } from '../../components/atoms/Badge/constants';
export { POSITIONS_WITH_COMPANY, AVAILABLE_POSITIONS_GROUPED } from '../../utils/constants';
export { AVAILABLE_POSITIONS } from '../../utils/mockData';
export { filterPhoneInput } from '../../utils/phoneValidation';
export { sanitizeInput, sanitizeFormField } from '../../utils/sanitization';
export { getSafeErrorMessage, SafeErrorMessages } from '../../utils/secureErrorHandling';
