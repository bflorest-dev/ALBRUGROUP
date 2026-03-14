import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Applicant, Employee } from '../types';
import { loadApplicantsFromStorage, saveApplicantsToStorage, loadEmployeesFromStorage, saveEmployeesToStorage } from '../utils/localStorage';

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
  
  // Loading state
  loading: boolean;
}

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
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data from localStorage (both applicants and employees)
  const loadInitialData = useCallback(() => {
    try {
      setLoading(true);
      
      const storedApplicants = loadApplicantsFromStorage();
      const applicantsData: Applicant[] = storedApplicants && Array.isArray(storedApplicants) ? storedApplicants : [];
      setApplicants(applicantsData);
      
      const storedEmployees = loadEmployeesFromStorage();
      const employeesData: Employee[] = (storedEmployees && Array.isArray(storedEmployees) ? storedEmployees : []) as Employee[];
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading data from storage:', error);
      setApplicants([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial data on mount and listen for storage updates
  useEffect(() => {
    loadInitialData();
    
    // Listen for changes in localStorage from OTHER TABS
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'applicantsData' || event.key === 'employeesData') {
        loadInitialData();
      }
    };
    
    // Listen for local changes
    const handleApplicantsUpdated = () => loadInitialData();
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('applicantsUpdated', handleApplicantsUpdated);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('applicantsUpdated', handleApplicantsUpdated);
    };
  }, [loadInitialData]);

  // Dispatch event when applicants change (for synchronization)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('applicantsContextUpdated'));
    window.dispatchEvent(new Event('applicantsUpdated'));
  }, [applicants]);

  // Dispatch event when employees change
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('employeesContextUpdated'));
    window.dispatchEvent(new Event('employeesUpdated'));
  }, [employees]);

  // APPLICANTS METHODS
  const addApplicant = useCallback((applicant: Applicant) => {
    setApplicants(prev => {
      const updated = [...prev, applicant];
      saveApplicantsToStorage(updated);
      return updated;
    });
  }, []);

  const updateApplicant = useCallback((id: string, applicant: Applicant) => {
    setApplicants(prev => {
      const updated = prev.map(app => (app.id === id ? applicant : app));
      saveApplicantsToStorage(updated);
      return updated;
    });
  }, []);

  const deleteApplicant = useCallback((id: string) => {
    setApplicants(prev => {
      const updated = prev.filter(app => app.id !== id);
      saveApplicantsToStorage(updated);
      return updated;
    });
  }, []);

  // EMPLOYEES METHODS
  const addEmployee = useCallback((employee: Employee) => {
    setEmployees(prev => {
      const updated = [...prev, employee];
      saveEmployeesToStorage(updated);
      return updated;
    });
  }, []);

  const updateEmployee = useCallback((id: string, employee: Applicant) => {
    setEmployees(prev => {
      const updated = prev.map(emp => (emp.id === id ? employee as unknown as Employee : emp));
      saveEmployeesToStorage(updated);
      return updated;
    });
  }, []);

  const deleteEmployee = useCallback((id: string) => {
    setEmployees(prev => {
      const updated = prev.filter(emp => emp.id !== id);
      saveEmployeesToStorage(updated);
      return updated;
    });
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
      loading
    }),
    [applicants, addApplicant, updateApplicant, deleteApplicant, employees, addEmployee, updateEmployee, deleteEmployee, removeApplicant, hireApplicant, loading]
  );

  return (
    <ApplicantsContext.Provider value={contextValue}>
      {children}
    </ApplicantsContext.Provider>
  );
};
