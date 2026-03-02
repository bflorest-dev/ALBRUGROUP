/**
 * DataContext - Contexto global para postulantes y empleados
 */

import { createContext, useContext, useState, type ReactNode } from 'react';
import { mockApplicants, mockEmployees } from '../utils/mockData';
import type { Employee, Applicant } from '../types';

interface DataContextType {
  applicants: Applicant[];
  employees: Employee[];
  setApplicants: (applicants: Applicant[]) => void;
  setEmployees: (employees: Employee[]) => void;
  removeApplicant: (id: string) => void;
  addEmployee: (employee: Employee) => void;
  hireApplicant: (applicant: Applicant, employee: Employee) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [applicants, setApplicants] = useState<Applicant[]>(mockApplicants);
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);

  const removeApplicant = (id: string) => {
    setApplicants(applicants.filter((app) => app.id !== id));
  };

  const addEmployee = (employee: Employee) => {
    setEmployees([...employees, employee]);
  };

  const hireApplicant = (applicant: Applicant, employee: Employee) => {
    removeApplicant(applicant.id);
    addEmployee(employee);
  };

  return (
    <DataContext.Provider value={{ applicants, employees, setApplicants, setEmployees, removeApplicant, addEmployee, hireApplicant }}>
      {children}
    </DataContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData debe usarse dentro de DataProvider');
  }
  return context;
};
