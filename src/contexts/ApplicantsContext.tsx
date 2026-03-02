import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Applicant } from '../types';
import { loadApplicantsFromStorage, saveApplicantsToStorage } from '../utils/localStorage';

interface ApplicantsContextType {
  applicants: Applicant[];
  addApplicant: (applicant: Applicant) => void;
  updateApplicant: (id: string, applicant: Applicant) => void;
  deleteApplicant: (id: string) => void;
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

interface ApplicantsProviderProps {
  children: React.ReactNode;
}

export const ApplicantsProvider: React.FC<ApplicantsProviderProps> = ({ children }) => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data from localStorage
  const loadInitialData = useCallback(() => {
    try {
      setLoading(true);
      const stored = loadApplicantsFromStorage();
      const applicantsData: Applicant[] = stored && Array.isArray(stored) ? stored : [];
      setApplicants(applicantsData);
    } catch (error) {
      console.error('Error loading applicants:', error);
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial data on mount and listen for storage updates
  useEffect(() => {
    loadInitialData();
    
    // Escuchar cambios en localStorage desde OTRAS TABS
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'applicantsData') {
        loadInitialData();
      }
    };
    
    // Escuchar cambios locales
    const handleApplicantsUpdated = () => loadInitialData();
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('applicantsUpdated', handleApplicantsUpdated);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('applicantsUpdated', handleApplicantsUpdated);
    };
  }, [loadInitialData]);

  // Dispara evento CUANDO EL CONTEXT CAMBIA (para sincronización en la misma tab y entre tabs)
  useEffect(() => {
    // Dispara evento para listeners locales (useApplicantsSync)
    window.dispatchEvent(new CustomEvent('applicantsContextUpdated'));
    // También dispara el evento global de localStorage para mantener compatibilidad
    window.dispatchEvent(new Event('applicantsUpdated'));
  }, [applicants]);

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

  return (
    <ApplicantsContext.Provider value={{ applicants, addApplicant, updateApplicant, deleteApplicant, loading }}>
      {children}
    </ApplicantsContext.Provider>
  );
};
