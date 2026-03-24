// Hooks de paginación
export { usePaginacion, usePagination } from './usePaginacion';
export { usePaginacion as usePaginationPattern } from './usePaginacion';

// Hooks de manejo de errores
export { useManejadorError, useErrorHandler, createError, reportError } from './useManejadorError';

// Hooks de validación de formularios
export { useValidacionFormulario, useFormularioValidado, useFormValidation, useValidatedForm, type ValidationErrors } from './useValidacionFormulario';

// Hooks de patrones comunes
export { useModal, useToggle, useFormularioDatos, useExpandido, useAsincrono, useFormData, useExpanded, useAsync } from './usePatronesComunes';

// Hooks desde src/hooks (features específicas)
export { useBackofficeLeads } from '../../hooks/useBackofficeLeads';
export { useTipification } from '../../hooks/useTipification';
export { useApplicantsSync } from '../../hooks/useApplicantsSync';

// Hooks desde contexts
export { useNotification } from '../../contexts/useNotification';
export { useSidebar } from '../../contexts/SidebarContext';
