// Utility functions for localStorage management

export const clearAllStorage = (): void => {
  localStorage.clear();
  sessionStorage.clear();
};

export const removeItem = (key: string): void => {
  localStorage.removeItem(key);
};

export const setItem = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error setting localStorage:', error);
  }
};

export const getItem = (key: string): any => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error retrieving localStorage:', error);
    return null;
  }
};

// ============================================================================
// Input Filtering & Sanitization
// ============================================================================

/**
 * Filter phone input to only allow digits
 */
export const filterPhoneInput = (value: string): string => {
  return value.replace(/\D/g, '');
};

/**
 * Sanitize form field input
 */
export const sanitizeInput = (value: any): string => {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[<>]/g, '');
};

/**
 * Sanitize form field with HTML encoding
 */
export const sanitizeFormField = (value: any): string => {
  return sanitizeInput(value);
};

// ============================================================================
// Error Handling
// ============================================================================

export const SafeErrorMessages = {
  GENERIC: 'Ocurrió un error',
  NETWORK: 'Error de conexión',
  INVALID_INPUT: 'Entrada inválida',
  CREATE_FAILED: 'No se pudo crear el registro',
  VALIDATION: 'Error de validación',
  UNAUTHORIZED: 'No autorizado',
  NOT_FOUND: 'No encontrado',
  SERVER: 'Error del servidor',
} as const;

/**
 * Get safe error message from unknown error
 */
export const getSafeErrorMessage = (error: unknown, fallback?: string): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return fallback ?? SafeErrorMessages.GENERIC;
};

// ============================================================================
// Constants - Positions & Companies
// ============================================================================

/**
 * Positions that require a company assignment
 */
export const POSITIONS_WITH_COMPANY = [
  'SUPERVISOR_BACKOFFICE',
  'ASESOR_BACKOFFICE',
  'SUPERVISOR_VENTAS',
  'ASESOR_VENTAS',
  'ASESOR_DE_VENTAS',
];

export const EVENT_NAMES = {
  APPLICANT_ADDED: 'APPLICANT_ADDED',
  APPLICANT_REMOVED: 'APPLICANT_REMOVED',
} as const;

export const dispatchAppEvent = (eventName: string, payload?: unknown): void => {
  console.debug('App event', eventName, payload);
};

export const loadApplicantsFromStorage = (): unknown => {
  return getItem('applicants');
};

export const saveApplicantsToStorage = (value: unknown): void => {
  setItem('applicants', value);
};

export const loadEmployeesFromStorage = (): unknown => {
  return getItem('employees');
};

export const saveEmployeesToStorage = (value: unknown): void => {
  setItem('employees', value);
};

/**
 * Available positions in the system
 */
export const AVAILABLE_POSITIONS = [
  'RRHH',
  'CAPACITACION',
  'ADMIN_EMPLEADOS',
  'GTR',
  'SUPERVISOR_GTR',
  'ASESOR_GTR',
  'COMMUNITY',
  'SUPERVISOR_VENTAS',
  'ASESOR_DE_VENTAS',
  'SUPERVISOR_BACKOFFICE',
  'ASESOR_BACKOFFICE',
  'RECEPCION',
];

export { AVAILABLE_POSITIONS_GROUPED } from '@shared/utils/mockData';

// Re-export from base service (for convenience)
export { BaseService } from './base.service';

// Utility Hooks and Providers for compatibility stubs
import React, { createContext, useContext, useState } from 'react';

type Toast = { id: string; message: string; type?: 'info' | 'success' | 'error' };

interface NotificationContextType {
  toasts: Toast[];
  addToast: (toast: Toast) => void;
  removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Toast) => {
    setToasts((prev) => [...prev, toast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return React.createElement(NotificationContext.Provider, { value: { toasts, addToast, removeToast } }, children);
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    return { toasts: [], addToast: () => {}, removeToast: () => {} };
  }
  return context;
};

export const useDevRole = () => {
  const [selectedRole, setSelectedRole] = useState<'LOGIN' | 'RRHH' | 'ADMINISTRADOR' | 'RECLUTAMIENTO' | 'CAPACITACIÓN' | 'COMMUNITY' | 'GTR' | 'ASESOR_DE_VENTAS'>(
    'LOGIN'
  );
  return { selectedRole, setSelectedRole };
};

interface SidebarContextType {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setCollapsed((prev) => !prev);
  return React.createElement(SidebarContext.Provider, { value: { collapsed, toggle } }, children);
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    return { collapsed: false, toggle: () => {} };
  }
  return context;
};

export { TIPIFICATION_BLOCKS } from '@shared/utils/tipificationConstants';


