import { useState, useEffect, useRef } from 'react';
import { useApplicants } from '../contexts/ApplicantsContext';
import { EVENT_NAMES } from '../types/events';

/**
 * Acceso a la ref global de sincronización para empleados
 */
declare global {
  var __employeesGlobalSyncVersion: number;
}

/**
 * Custom hook que sincroniza los empleados del Context
 * Escucha cambios en los datos y fuerza re-render cuando hay actualizaciones
 */
export const useEmployeesSync = () => {
  const { employees } = useApplicants();
  const [syncVersion, setSyncVersion] = useState(0);
  const lastGlobalVersionRef = useRef(globalThis.__employeesGlobalSyncVersion ?? 0);

  useEffect(() => {
    // Handler directo que incrementa la versión (fuerza re-render)
    const handleEmployeesUpdate = (event: Event) => {
      globalThis.__employeesGlobalSyncVersion = (globalThis.__employeesGlobalSyncVersion ?? 0) + 1;
      setSyncVersion(v => v + 1);
    };

    // Registrar listener directamente
    // IMPORTANTE: Usar addEventListener directo para garantizar que se registre
    window.addEventListener(EVENT_NAMES.EMPLOYEES_UPDATED, handleEmployeesUpdate);

    // Cleanup: desuscribirse al desmontar el componente
    return () => {
      window.removeEventListener(EVENT_NAMES.EMPLOYEES_UPDATED, handleEmployeesUpdate);
    };
  }, []);

  // Verificar si GlobalSync cambió desde la última vez que nos montamos
  // Esto garantiza sincronización incluso si el evento se disparó antes de que el hook se montara
  useEffect(() => {
    const currentGlobalVersion = globalThis.__employeesGlobalSyncVersion ?? 0;
    if (currentGlobalVersion > lastGlobalVersionRef.current) {
      lastGlobalVersionRef.current = currentGlobalVersion;
      setSyncVersion(v => v + 1);
    }
  }, []); // Solo una vez on mount

  return { employees, syncVersion };
};
