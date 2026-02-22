/**
 * Tipos e interfaces globales de la aplicación
 */

export type EmployeeStatus = 'ACTIVO' | 'INACTIVO';

export interface Employee {
  id: string;
  initials: string;
  fullName: string;
  nombres?: string;
  apellidos?: string;
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
  nombres?: string;
  apellidos?: string;
  phoneMobile: string;
  documentType: string;
  documentNumber: string;
  positionOfInterest: string;
  modality: string;
  campaign: string;
  company: string; // CLARO | WIN
  status?: string;
  trainingDayPayment?: number;
  startDate?: string;
  endDate?: string;
  personalEmail?: string;
  rejectionReason?: string; // motivo de rechazo cuando status = 'RECHAZADO'
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
  nombres: string;
  apellidos: string;
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
  nombres: string;
  apellidos: string;
  phoneMobile: string;
  documentType: 'DNI' | 'CE';
  documentNumber: string;
  positionOfInterest: string;
  company: string; // CLARO | WIN
  campaign: string;
}

export interface EditApplicantFormData extends NewApplicantFormData {
  id: string;
}

export interface HireApplicantFormData extends NewEmployeeFormData {
  applicantId: string;
  personalEmail?: string;
}

export interface EmployeeDetailFormData {
  nombres: string;
  apellidos: string;
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

// Tipos para respuestas del backend
export interface EmpleadoResponse {
  id: number;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nacionalidad: string;
  fechaNacimiento: string;
  estadoCivil: string;
  tieneHijos: boolean;
  celularPersonal: string;
  correoPersonal: string;
  celularCorporativo: string;
  correoCorporativo: string;
  distrito: string;
  direccion: string;
  banco: string;
  cuentaBancaria: string;
  cuentaInterbancaria: string;
  estadoOperativo: string;
}

export interface PostulanteResponse {
  id: number;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  celularPersonal: string;
  origen: string;
  puestoTrabajo: string;
  compania?: string;
  estadoPostulacion: string;
  pagoDiaCapacitacion: number;
  fechaInicio: string;
  fechaFin: string;
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      empty: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    empty: boolean;
    unsorted: boolean;
  };
  empty: boolean;
}


// Request payloads para API
export interface PostulanteRequest {
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  celularPersonal: string;
  puestoTrabajo: string;
  compania?: string;
  origen: string;
  estadoPostulacion?: string;
  pagoDiaCapacitacion?: number;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface ApplicantStatusChange {
  id: number | string;
  estadoPostulacion: string;
}

// Adapters para convertir respuestas del backend a modelos internos
export const adaptEmpleadoResponseToEmployee = (backend: EmpleadoResponse): Employee => ({
  id: backend.id.toString(),
  initials: `${backend.nombres.charAt(0)}${backend.apellidos.charAt(0)}`.toUpperCase(),
  fullName: `${backend.nombres} ${backend.apellidos}`,
  position: '', // No disponible en backend
  department: '', // No disponible
  status: backend.estadoOperativo as EmployeeStatus,
  documentType: backend.tipoDocumento,
  documentNumber: backend.numeroDocumento,
  nationality: backend.nacionalidad,
  birthDate: backend.fechaNacimiento,
  civilStatus: backend.estadoCivil,
  hasChildren: backend.tieneHijos,
  district: backend.distrito,
  address: backend.direccion,
  phoneFixed: '', // No disponible
  phoneMobile: backend.celularPersonal,
  phoneWork: backend.celularCorporativo,
  personalEmail: backend.correoPersonal,
  bank: backend.banco,
  accountNumber: backend.cuentaBancaria,
  interbankNumber: backend.cuentaInterbancaria,
  startDate: '', // No disponible
  endDate: '', // No disponible
  modality: '', // No disponible
  scheduleType: '', // No disponible
  googleEmail: backend.correoCorporativo,
  baseSalary: '', // No disponible
});

export const adaptPostulanteResponseToApplicant = (backend: PostulanteResponse): Applicant => {
  // normalizar algunos estados para la UI
  let status = backend.estadoPostulacion;
  if (status === 'EN_PROCESO') {
    status = 'POSTULANTE';
  }

  return {
    id: backend.id.toString(),
    fullName: `${backend.nombres} ${backend.apellidos}`.trim(),
    nombres: backend.nombres,
    apellidos: backend.apellidos,
    phoneMobile: backend.celularPersonal,
    documentType: backend.tipoDocumento,
    documentNumber: backend.numeroDocumento,
    positionOfInterest: backend.puestoTrabajo,
    modality: '', // No disponible en backend
    campaign: backend.origen,
    company: backend.compania || 'CLARO',
    status: status,
    trainingDayPayment: backend.pagoDiaCapacitacion,
    startDate: backend.fechaInicio,
    endDate: backend.fechaFin,
    personalEmail: '',
  };
};

