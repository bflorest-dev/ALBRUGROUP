import { useState, useEffect } from 'react';
import { useApplicants } from '../contexts/ApplicantsContext';

/**
 * Custom hook que sincroniza los postulantes del Context
 * y fuerza re-render solo cuando hay cambios en applicants
 */
export const useApplicantsSync = () => {
  const { applicants } = useApplicants();
  const [syncVersion, setSyncVersion] = useState(0);

  useEffect(() => {
    const handleContextUpdate = () => {
      setSyncVersion(v => v + 1);
    };

    // Escucha el evento que dispara el Context (más rápido que localStorage)
    window.addEventListener('applicantsContextUpdated', handleContextUpdate);
    return () => window.removeEventListener('applicantsContextUpdated', handleContextUpdate);
  }, []);

  return { applicants, syncVersion };
};
