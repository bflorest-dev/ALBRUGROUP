/**
 * Hooks Layer - Re-export barrel para compatibilidad backward
 * 
 * MIGRACIÓN FSD (FASE 7):
 * Los hooks globales se han movido a compartido/ganchos
 * Los hooks específicos se han movido a sus features correspondientes
 */

// Hooks globales (ahora en compartido/ganchos)
export { usePaginacion, usePagination } from '@compartido/ganchos';
export { useManejadorError, useErrorHandler, createError, reportError } from '@compartido/ganchos';
export { useValidacionFormulario, useFormularioValidado, useFormValidation, useValidatedForm, type ValidationErrors } from '@compartido/ganchos';
export { useModal, useToggle, useFormularioDatos, useExpandido, useAsincrono, useFormData, useExpanded, useAsync, usePaginationPattern } from '@compartido/ganchos';

// Hooks específicos de features
export { useApplicantsSync } from '@caracteristicas/registrar-postulante/modelo/ganchos';
export { useApplicantsTable } from '@widgets/tabla-postulantes/ganchos';
export { useEmployeesSync } from '@caracteristicas/registrar-empleado/modelo/ganchos';

// Otros hooks (que aún no fueron migrados)
export { useBackofficeLeads } from './useBackofficeLeads';
export { useTipification } from './useTipification';