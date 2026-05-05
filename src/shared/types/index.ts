export type { Role } from './roles';
export type { ApiResponse, PaginatedResponse } from './api';

export * from './community';
export * from './lead.types';
export * from './lead.responses';
export * from './lead.requests';
export * from './backend';
export * from './eventos';
export * from './enums';
export * from './backendEnums';
export * from './tipification.types';
export * from './ofertaLaboral';
export * from './employee';

export const dispatchAppEvent = (eventName: string, payload?: unknown): void => {
  console.debug('dispatchAppEvent', eventName, payload);
};

// ============================================================================
// Domain Types - Employee
// ============================================================================
export interface EmpleadoResponse {
  id: number | string;
  nombres?: string;
  apellidos?: string;
  fullName?: string;
  email?: string;
  celular?: string;
  phoneMobile?: string;
  personalEmail?: string;
  district?: string;
  address?: string;
  position?: string;
  baseSalary?: number;
  startDate?: string;
  endDate?: string;
  bank?: string;
  accountNumber?: string;
  interbankNumber?: string;
  contractOwnAccount?: boolean;
  contractKinship?: string;
  contractCellularTransfer?: string;
  contractorCompany?: string;
  numeroDocumento?: string;
  documentType?: string;
  documentNumber?: string;
  nationality?: string;
  birthDate?: string;
  civilStatus?: string;
  hasChildren?: boolean;
  puesto?: string;
  compania?: string;
  estado?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type Employee = EmpleadoResponse;

export interface NewEmployeeFormData {
  // RegistrarEmpleadoRequest
  nombres: string;
  apellidos: string;
  tipoDocumento: 'DNI' | 'CE';
  numeroDocumento: string;
  nacionalidad: 'PERUANO' | 'EXTRANJERO';
  fechaNacimiento: string;
  estadoCivil: 'SOLTERO' | 'CASADO' | 'VIUDO' | 'DIVORCIADO';
  tieneHijos: boolean;
  celularPersonal: string;
  correoPersonal: string;
  origen: 'COMPUTRABAJO' | 'INDEED' | 'TIKTOK' | 'FACEBOOK' | 'LINKEDIN' | 'REFERIDO';
  distrito: string;
  direccion: string;
  banco: 'BCP' | 'BBVA' | 'INTERBANK' | 'SCOTIABANK' | 'BANCO_DE_LA_NACION';
  cuentaBancaria: string;
  cuentaInterbancaria: string;
  cuentaPropia: boolean;
  parentesco?: 'PADRE' | 'MADRE' | 'TIO' | 'ESPOSO' | 'HERMANO' | 'ABUELO' | 'PAREJA' | 'OTRO' | '';
  celularTransferencia: string;
  idEmpresaContratista: number | '';

  // RegistrarContratoRequest
  idPostulacion: number | '';
  puestoTrabajo: string;
  regimen: 'RECIBO_POR_HONORARIOS' | 'PLANILLA';
  modalidad: 'PART_TIME' | 'FULL_TIME' | 'SEMI_FULL' | 'SUPER_FULL';
  seguroSalud: 'SIS' | 'ESSALUD';
  sistemaPensiones: 'ONP' | 'AFP_INTEGRA' | 'AFP_PROFUTURO' | 'AFP_HABITAT' | 'PRIMA_AFP';
  sueldoBase: number | '';
  fechaInicio: string;
  fechaFin: string;
}

export interface EmployeeDetailFormData extends Partial<NewEmployeeFormData> {
  id?: number | string;
}

export function adaptEmpleadoResponseToEmployee(data: EmpleadoResponse): Employee {
  return data;
}

// ============================================================================
// Domain Types - Applicant/Postulante
// ============================================================================
export interface PostulanteResponse {
  id: number;
  nombres: string;
  apellidos: string;
  email?: string;
  phoneMobile?: string;
  celular?: string;
  documentType?: string;
  documentNumber?: string;
  positionOfInterest?: string;
  campaign?: string;
  company?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type Applicant = PostulanteResponse;

export interface NewApplicantFormData {
  nombres: string;
  apellidos: string;
  email?: string;
  phoneMobile: string;
  documentType: 'DNI' | 'CE';
  documentNumber: string;
  positionOfInterest: string;
  campaign: string;
  company?: string;
}

export function adaptPostulanteResponseToApplicant(data: PostulanteResponse): Applicant {
  return data;
}

// API models - RegistrarPostulanteRequest (Backend DTO)
export interface RegistrarPostulanteRequest {
  // Datos personales (requeridos)
  nombres: string;
  apellidos: string;
  tipoDocumento: 'DNI' | 'CE';
  numeroDocumento: string;

  // Contacto
  phoneMobile: string;
  email?: string;

  // Laboral (requeridos)
  puestoTrabajo: string; // Enum PuestoTrabajoEnum
  compania?: string; // Enum CompaniaEnum

  // Origen/Campaña (requerido)
  origen: string; // Enum OrigenEnum
}

export interface EventoPostulanteRequest {
  postulanteId: number;
  event: string;
  details?: string;
}


export interface HireApplicantFormData {
  aplicanteId?: string | number;
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
  phoneMobile: string;
  bank: string;
  accountNumber: string;
  interbankNumber: string;
  baseSalary: string;
  role: string;
  startDate: string;
  modality: string;
  scheduleType: string;
  personalEmail: string;
  applicantId: string;
  puesto: string;
  salario?: number;
  fechaInicio?: string;
}

// ============================================================================
// Domain Types - Contract
// ============================================================================

export interface CredencialesResponse {
  username: string;
  password: string;
}

export interface ContratoResponse {
  id: number;
  idEmpleado: number;
  puestoTrabajo: string;
  regimen: string;
  modalidad: string;
  seguroSalud: string;
  sistemaPensiones: string;
  sueldoBase: number;
  fechaInicio: string;
  fechaFin?: string;
}

export interface RegistrarContratoRequest {
  idPostulacion?: number;
  puestoTrabajo: string;
  regimen: 'RECIBO_POR_HONORARIOS' | 'PLANILLA';
  modalidad: 'PART_TIME' | 'FULL_TIME' | 'SEMI_FULL' | 'SUPER_FULL';
  seguroSalud: 'SIS' | 'ESSALUD';
  sistemaPensiones: 'ONP' | 'AFP_INTEGRA' | 'AFP_PROFUTURO' | 'AFP_HABITAT' | 'PRIMA_AFP';
  sueldoBase: number;
  fechaInicio: string;
  fechaFin?: string;

  // Legacy optional fields kept for backward compatibility.
  puesto?: string;
  salario?: number;
  tipoContrato?: string;
}

export interface CerrarContratoRequest {
  motivoBaja: string;
  fechaCierre?: string;
}

export interface ContratoRegistroResponse {
  contrato: ContratoResponse;
  credenciales: CredencialesResponse;
}

// ============================================================================
// Domain Types - Lead
// ============================================================================
export interface LeadDTO {
  id: number;
  nombre: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  telefono?: string;
  channel?: string;
  advisor?: string;
  campaign?: string;
  followUp?: string;
  origen?: string;
  estado?: 'nuevo' | 'contactado' | 'tipificado' | 'convertido';
  createdAt?: string;
  updatedAt?: string;
}

export interface Statistic {
  id: string;
  label: string;
  value: number | string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

export * from './backendEnums';

// ============================================================================
// API Response Types
// ============================================================================
export interface PageResponse<T> {
  content: T[];
  items?: T[];
  total: number;
  totalPages: number;
  currentPage?: number;
  pageSize?: number;
}

