/**
 * Hooks Layer - Barrel central para todos los hooks reutilizables
 * 
 * FSD Layer: shared/hooks
 * Comprende: hooks genéricos de UI, paginación, manejo de errores, etc.
 */

import { useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// GENERIC HOOKS (Hooks reutilizables sin lógica de negocio)
// ═══════════════════════════════════════════════════════════════════════════════

export const usePaginacion = () => ({ page: 1, setPage: (_p: number) => {} });
export const usePagination = usePaginacion;

export const useManejadorError = () => ({ error: null as string | null, setError: (_e: string | null) => {} });
export const useErrorHandler = useManejadorError;
export const createError = (message: string) => new Error(message);
export const reportError = (_error: unknown) => {};

export type ValidationErrors = Record<string, string>;
export const useValidacionFormulario = () => ({ errors: {} as ValidationErrors, validate: () => true });
export const useFormularioValidado = useValidacionFormulario;
export const useFormValidation = useValidacionFormulario;
export const useValidatedForm = useValidacionFormulario;

export const useModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) };
};

export const useToggle = (initial = false) => {
  const [value, setValue] = useState(initial);
  return { value, toggle: () => setValue((v) => !v), setValue };
};

export const useFormularioDatos = <T extends Record<string, unknown>>(initial: T) => {
  const [data, setData] = useState<T>(initial);
  return { data, setData };
};
export const useFormData = useFormularioDatos;

export const useExpandido = () => ({ expandedId: null as string | null, setExpandedId: (_id: string | null) => {} });
export const useExpanded = useExpandido;

export const useAsincrono = () => ({ loading: false, run: async <T,>(fn: () => Promise<T>) => fn() });
export const useAsync = useAsincrono;

export const usePaginationPattern = usePaginacion;

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE-SPECIFIC HOOKS (Hooks con lógica de negocio - importar desde features)
// ═══════════════════════════════════════════════════════════════════════════════

export { useApplicantsTable } from './useApplicantsTable';

// ═══════════════════════════════════════════════════════════════════════════════
// OTHER HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export { useBackofficeLeads } from './useBackofficeLeads';
export { useTipification } from './useTipification';
export { useAsesoresVentasConectados, useAsesoresConectados } from './useAsesoresConectados';
export { useHeartbeat } from './useHeartbeat';

// Compatibility aliases (Spanish/English)
export const useSidebar = () => ({ collapsed: false, toggle: () => {} });
export const useNotification = () => ({ toasts: [] as any[], addToast: (_toast: any) => {}, removeToast: (_id: string) => {}, showSuccess: (_msg: string) => {}, showError: (_msg: string) => {} });