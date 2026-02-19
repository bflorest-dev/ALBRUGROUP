import type { HRUser, HRDashboardData } from './types';

export const getHRUser = async (id: string): Promise<HRUser> => {
  // Mock implementation
  return {
    id,
    name: 'HR User',
    email: 'hr@example.com',
    role: 'RRHH',
    permissions: ['EMPLOYEE_READ', 'EMPLOYEE_WRITE'],
    department: 'Human Resources',
    managedEmployees: ['emp1', 'emp2'],
  };
};

export const getHRDashboardData = async (): Promise<HRDashboardData> => {
  // Mock implementation
  return {
    totalEmployees: 100,
    newHires: [
      {
        id: '1',
        name: 'New Employee',
        position: 'Developer',
        department: 'IT',
        hireDate: new Date(),
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    pendingReviews: [
      {
        id: '1',
        employeeId: 'emp1',
        type: 'PERFORMANCE',
        dueDate: new Date(),
      },
    ],
  };
};