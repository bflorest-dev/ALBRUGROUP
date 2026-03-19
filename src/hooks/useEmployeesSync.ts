import { useState, useEffect, useRef, useCallback } from 'react';
import { EmployeeService } from '../services/employee.service';
import type { Employee } from '../types';
import { EVENT_NAMES } from '../types/events';

/**
 * Acceso a la ref global de sincronización para empleados
 */
declare global {
  var __employeesGlobalSyncVersion: number;
}

/**
 * Custom hook que sincroniza los empleados desde el backend (EmployeeService)
 * Llama a la API al montarse y escucha cambios de empleados
 */
export const useEmployeesSync = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);
  const lastGlobalVersionRef = useRef(globalThis.__employeesGlobalSyncVersion ?? 0);

  // Cargar empleados desde el backend
  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const result = await EmployeeService.getAllEmployees({ page: 0, size: 100 });
      setEmployees(result.items);
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Recargar datos cuando hay un evento de actualización
  useEffect(() => {
    const handleEmployeesUpdate = () => {
      globalThis.__employeesGlobalSyncVersion = (globalThis.__employeesGlobalSyncVersion ?? 0) + 1;
      setSyncVersion(v => v + 1);
      loadEmployees();
    };

    window.addEventListener(EVENT_NAMES.EMPLOYEES_UPDATED, handleEmployeesUpdate);

    return () => {
      window.removeEventListener(EVENT_NAMES.EMPLOYEES_UPDATED, handleEmployeesUpdate);
    };
  }, [loadEmployees]);

  // Cargar al montar el hook
  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Verificar si GlobalSync cambió desde la última vez que nos montamos
  useEffect(() => {
    const currentGlobalVersion = globalThis.__employeesGlobalSyncVersion ?? 0;
    if (currentGlobalVersion > lastGlobalVersionRef.current) {
      lastGlobalVersionRef.current = currentGlobalVersion;
      setSyncVersion(v => v + 1);
    }
  }, []);

  return { employees, syncVersion, loading, refetch: loadEmployees };
};
