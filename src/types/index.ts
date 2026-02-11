/**
 * Tipos e interfaces globales de la aplicación
 */

export type EmployeeStatus = 'ACTIVO' | 'INACTIVO';

export interface Employee {
  id: string;
  initials: string;
  fullName: string;
  position: string;
  department: string;
  status: EmployeeStatus;
  documentType?: string;
  documentNumber?: string;
  nationality?: string;
  birthDate?: string;
  civilStatus?: string;
  hasChildren?: boolean;
  district?: string;
  address?: string;
  phoneFixed?: string;
  phoneMobile?: string;
  phoneWork?: string;
  personalEmail?: string;
  bank?: string;
  accountNumber?: string;
  interbankNumber?: string;
  startDate?: string;
  endDate?: string;
  modality?: string;
  scheduleType?: string;
  googleEmail?: string;
  baseSalary?: string;
}

export interface Statistic {
  label: string;
  value: number;
  percentage?: number;
  icon?: string;
}

export interface Applicant {
  id: string;
  fullName: string;
  phoneMobile: string;
  documentType: string;
  documentNumber: string;
  positionOfInterest: string;
  modality: string;
  campaign: string;
  trainingDayPayment?: number;
  startDate?: string;
  endDate?: string;
  personalEmail?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  totalPages: number;
}

export interface UserProfile {
  name: string;
  role: string;
  avatar?: string;
}

// Tipos específicos para formularios
export interface NewEmployeeFormData {
  fullName: string;
  documentType: 'DNI' | 'CE';
  documentNumber: string;
  nationality: string;
  birthDate: string;
  civilStatus: string;
  hasChildren: boolean;
  district: string;
  address: string;
  phoneFixed: string;
  phoneMobile: string;
  phoneWork: string;
  bank: string;
  accountNumber: string;
  interbankNumber: string;
  baseSalary: string;
  role: string;
  startDate: string;
  modality: string;
  scheduleType: string;
  googleEmail: string;
  personalEmail?: string;
}

export interface NewApplicantFormData {
  fullName: string;
  phoneMobile: string;
  documentType: 'DNI' | 'CE';
  documentNumber: string;
  positionOfInterest: string;
  modality: string;
  campaign: string;
  trainingDayPayment?: number;
  startDate?: string;
  endDate?: string;
}

export interface EditApplicantFormData extends NewApplicantFormData {
  id: string;
}

export interface HireApplicantFormData extends NewEmployeeFormData {
  applicantId: string;
  personalEmail?: string;
}

export interface EmployeeDetailFormData {
  fullName: string;
  documentType: string;
  documentNumber: string;
  nationality: string;
  birthDate: string;
  civilStatus: string;
  hasChildren: boolean; // true | false
  district: string;
  address: string;
  phoneFixed: string;
  phoneMobile: string;
  phoneWork: string;
  personalEmail: string;
  bank: string;
  accountNumber: string;
  interbankNumber: string;
  baseSalary: string;
  startDate: string;
  endDate: string;
  modality: string;
  scheduleType: string;
  googleEmail: string;
  position: string;
  department: string;
  status: string;
}

// Tipos para props de componentes de formulario
export interface BaseFormProps<T = Record<string, unknown>> {
  onSubmit: (formData: T) => void;
  onCancel: () => void;
}

export interface EditFormProps<T = Record<string, unknown>> extends BaseFormProps<T> {
  initialData?: Partial<T>;
  isEditing?: boolean;
}

