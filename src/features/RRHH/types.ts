import type { User, BaseEntity } from '../../shared/types';

export interface HRUser extends User {
  role: 'RRHH';
  department: string;
  managedEmployees: string[];
}

export interface HREmployeeCard extends BaseEntity {
  name: string;
  position: string;
  department: string;
  hireDate: Date;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface HRDashboardData {
  totalEmployees: number;
  newHires: HREmployeeCard[];
  pendingReviews: Review[];
}

export interface Review {
  id: string;
  employeeId: string;
  type: 'PERFORMANCE' | 'SALARY';
  dueDate: Date;
}