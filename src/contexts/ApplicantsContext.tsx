import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Applicant, Employee } from '@compartido/tipos';
import { EVENT_NAMES, dispatchAppEvent } from '@compartido/tipos';
import { loadApplicantsFromStorage, saveApplicantsToStorage, loadEmployeesFromStorage, saveEmployeesToStorage } from '@compartido/lib';

interface ApplicantsContextType {
  // Applicants
  applicants: Applicant[];
  addApplicant: (applicant: Applicant) => void;
  updateApplicant: (id: string, applicant: Applicant) => void;
  deleteApplicant: (id: string) => void;
  
  // Employees (merged from DataContext)
  employees: Employee[];
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, employee: Applicant) => void;
  deleteEmployee: (id: string) => void;
  
  // Legacy methods for compatibility
  removeApplicant: (id: string) => void;
  hireApplicant: (applicant: Applicant, employee: Employee) => void;
}

/**
 * Global sync version tracking
 * Persiste incluso cuando los componentes se desmontan
 * Para que listeners tarde registrados vean que hubo cambios
 */
globalThis.__applicantsGlobalSyncVersion = globalThis.__applicantsGlobalSyncVersion ?? 0;
globalThis.__employeesGlobalSyncVersion = globalThis.__employeesGlobalSyncVersion ?? 0;

const ApplicantsContext = createContext<ApplicantsContextType | undefined>(undefined);

export const useApplicants = () => {
  const context = useContext(ApplicantsContext);
  if (!context) {
    throw new Error('useApplicants must be used within an ApplicantsProvider');
  }
  return context;
};

// Legacy compatibility alias
export const useData = useApplicants;

interface ApplicantsProviderProps {
  children: React.ReactNode;
}

export const ApplicantsProvider: React.FC<ApplicantsProviderProps> = ({ children }) => {
  const [applicants, setApplicants] = useState<Applicant[]>(() => {
    try {
      const stored = loadApplicantsFromStorage();
      return (stored && Array.isArray(stored)) ? stored : [];
    } catch (error) {
      console.error('Error loading applicants from storage:', error);
      return [];
    }
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const stored = loadEmployeesFromStorage();
      return (stored && Array.isArray(stored)) ? stored : [];
    } catch (error) {
      console.error('Error loading employees from storage:', error);
      return [];
    }
  });

  // Loading state is prepared but can be used for async operations if needed in future
  // For now, localStorage operations are synchronous at initialization and on change

  // Save to localStorage and dispatch event whenever applicants change
  useEffect(() => {
    saveApplicantsToStorage(applicants);
    // Incrementar versión global para que listeners que se monten después sepan que hubo un cambio
    globalThis.__applicantsGlobalSyncVersion = (globalThis.__applicantsGlobalSyncVersion ?? 0) + 1;
    // Notificar a componentes que escuchen cambios en applicants
    dispatchAppEvent(EVENT_NAMES.APPLICANTS_UPDATED, { applicants });
  }, [applicants]);

  // Save to localStorage and dispatch event whenever employees change
  useEffect(() => {
    saveEmployeesToStorage(employees);
    // Incrementar versión global para que listeners que se monten después sepan que hubo un cambio
    globalThis.__employeesGlobalSyncVersion = (globalThis.__employeesGlobalSyncVersion ?? 0) + 1;
    // Notificar a componentes que escuchen cambios en employees
    dispatchAppEvent(EVENT_NAMES.EMPLOYEES_UPDATED, { employees });
  }, [employees]);

  // APPLICANTS METHODS
  const addApplicant = useCallback((applicant: Applicant) => {
    setApplicants(prev => [...prev, applicant]);
  }, []);

  const updateApplicant = useCallback((id: string, applicant: Applicant) => {
    setApplicants(prev => 
      prev.map(app => (app.id === id ? applicant : app))
    );
  }, []);

  const deleteApplicant = useCallback((id: string) => {
    setApplicants(prev => 
      prev.filter(app => app.id !== id)
    );
  }, []);

  // EMPLOYEES METHODS
  const addEmployee = useCallback((employee: Employee) => {
    setEmployees(prev => [...prev, employee]);
  }, []);

  const updateEmployee = useCallback((id: string, employee: Applicant) => {
    setEmployees(prev =>
      prev.map(emp => (emp.id === id ? employee as unknown as Employee : emp))
    );
  }, []);

  const deleteEmployee = useCallback((id: string) => {
    setEmployees(prev =>
      prev.filter(emp => emp.id !== id)
    );
  }, []);

  // LEGACY COMPATIBILITY METHODS (from old DataContext)
  const removeApplicant = useCallback((id: string) => {
    deleteApplicant(id);
  }, [deleteApplicant]);

  const hireApplicant = useCallback((applicant: Applicant, employee: Employee) => {
    removeApplicant(applicant.id);
    addEmployee(employee);
  }, [removeApplicant, addEmployee]);

  /**
   * Problema #5: Memoize context value
   * Ensures stable reference across renders
   * Prevents unnecessary re-renders in consuming components
   */
  const contextValue = useMemo(
    () => ({
      applicants,
      addApplicant,
      updateApplicant,
      deleteApplicant,
      employees,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      removeApplicant,
      hireApplicant,
    }),
    [applicants, addApplicant, updateApplicant, deleteApplicant, employees, addEmployee, updateEmployee, deleteEmployee, removeApplicant, hireApplicant]
  );

  return (
    <ApplicantsContext.Provider value={contextValue}>
      {children}
    </ApplicantsContext.Provider>
  );
};
