import { useMemo } from 'react';
import { useApplicants } from '../ApplicantsContext';

/**
 * Problema #5: Context Optimization - Selector Hooks
 * 
 * These hooks provide fine-grained access to ApplicantsContext
 * avoiding re-renders when unneeded values change.
 * 
 * Example:
 *   // Instead of:
 *   const { applicants, loading, addApplicant } = useApplicants();  // Re-renders on any value change
 *   
 *   // Use:
 *   const applicants = useApplicantsList();  // Only re-renders when applicants change
 *   const loading = useApplicantsLoading();  // Only re-renders when loading changes
 *   const { addApplicant } = useApplicantMutations();  // Never re-renders (functions are stable)
 */

/**
 * Get only the applicants list
 * Memoized to prevent re-renders when other context values change
 * Dependencies: applicants array
 */
export const useApplicantsList = () => {
  const context = useApplicants();
  return useMemo(() => context.applicants, [context.applicants]);
};

/**
 * Get only the employees list
 * Memoized to prevent re-renders when other context values change
 * Dependencies: employees array
 */
export const useEmployeesList = () => {
  const context = useApplicants();
  return useMemo(() => context.employees, [context.employees]);
};

/**
 * Get only the applicants mutation methods
 * Memoized: Functions are stable, so component only re-renders if functions themselves change
 * This is rare since callbacks are memoized in the Provider
 * Dependencies: mutation functions
 */
export const useApplicantMutations = () => {
  const context = useApplicants();
  return useMemo(
    () => ({
      addApplicant: context.addApplicant,
      updateApplicant: context.updateApplicant,
      deleteApplicant: context.deleteApplicant,
      removeApplicant: context.removeApplicant
    }),
    [context.addApplicant, context.updateApplicant, context.deleteApplicant, context.removeApplicant]
  );
};

/**
 * Get only the employees mutation methods
 * Memoized: Functions are stable
 * Dependencies: employee mutation functions
 */
export const useEmployeeMutations = () => {
  const context = useApplicants();
  return useMemo(
    () => ({
      addEmployee: context.addEmployee,
      updateEmployee: context.updateEmployee,
      deleteEmployee: context.deleteEmployee
    }),
    [context.addEmployee, context.updateEmployee, context.deleteEmployee]
  );
};

/**
 * Get applicants + mutations (common pattern)
 * Use this when you need to read AND write applicants
 * Dependencies: applicants array + mutation functions
 */
export const useApplicantsData = () => {
  const applicants = useApplicantsList();
  const mutations = useApplicantMutations();
  
  return useMemo(
    () => ({
      applicants,
      ...mutations
    }),
    [applicants, mutations]
  );
};

/**
 * Get employees + mutations (common pattern)
 * Use this when you need to read AND write employees
 * Dependencies: employees array + mutation functions
 */
export const useEmployeesData = () => {
  const employees = useEmployeesList();
  const mutations = useEmployeeMutations();
  
  return useMemo(
    () => ({
      employees,
      ...mutations
    }),
    [employees, mutations]
  );
};

/**
 * Get hire functionality (combining both applicants and employees data)
 * Legacy method for compatibility
 * Dependencies: hire function
 */
export const useHireFunctionality = () => {
  const context = useApplicants();
  return useMemo(
    () => ({
      hireApplicant: context.hireApplicant
    }),
    [context.hireApplicant]
  );
};
