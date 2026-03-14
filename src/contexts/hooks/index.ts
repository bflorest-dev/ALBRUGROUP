/**
 * Contexto Selectors para Problema #5: Context Optimization
 * 
 * Exporta todos los selector hooks para uso optimizado de contextos
 */

// ApplicantsContext Selectors
export {
  useApplicantsList,
  useEmployeesList,
  useApplicantsLoading,
  useApplicantMutations,
  useEmployeeMutations,
  useApplicantsData,
  useEmployeesData,
  useHireFunctionality
} from './useApplicantsSelectors';

// NotificationContext Selectors
export {
  useNotificationToasts,
  useNotificationActions,
  useShowSuccess,
  useShowError,
  useShowInfo,
  useNotification as useNotificationOptimized
} from './useNotificationSelectors';

// Legacy exports for backward compatibility
export { useApplicants } from '../ApplicantsContext';
export { useData } from '../ApplicantsContext';
export { useNotification } from '../useNotification';
