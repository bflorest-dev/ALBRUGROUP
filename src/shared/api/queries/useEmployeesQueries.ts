/**
 * React Query Hooks for Employees Module
 * 
 * Replaces useEmployeesSync hook with React Query
 * FSD Layer: shared/api/queries
 */

import { useQuery } from '@tanstack/react-query';
import { EmployeeRepository } from '../repositories/employee.repository';
import type { EmpleadoResponse, EmployeeDetailFormData, NewEmployeeFormData } from '@shared/types';

export const employeesQueryKeys = {
  all: () => ['employees'] as const,
  list: () => [...employeesQueryKeys.all(), 'list'] as const,
  detail: (id: number) => [...employeesQueryKeys.all(), 'detail', id] as const,
};

/**
 * Fetch all employees (replaces useEmployeesSync)
 */
export function useEmployeesQuery() {
  return useQuery({
    queryKey: employeesQueryKeys.list(),
    queryFn: () => EmployeeRepository.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Search employee by document
 */
export function useEmployeeByDocumentQuery(documento: string) {
  return useQuery({
    queryKey: [...employeesQueryKeys.all(), 'document', documento],
    queryFn: () => EmployeeRepository.getByDocument(documento),
    enabled: !!documento, // Only run if document provided
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
