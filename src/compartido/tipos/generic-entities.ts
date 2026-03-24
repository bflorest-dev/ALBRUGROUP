/**
 * TIPOS Y DTOs - ENTIDADES GENÉRICAS
 * 
 * Tipos base y DTOs genéricos utilizados en múltiples módulos.
 * Para tipos específicos de dominio, ver entidades/*.
 * 
 * Nota: Esta consolidación es temporal - los tipos deben migrar a sus entidades respectivas
 * en refactorizaciones posteriores (Phase 2+)
 */

/**
 * DTO para crear un nuevo postulante/aplicante (estructura UI)
 * Estructura basada en PersonalDataSchema + campos específicos
 */
export interface NewApplicantFormData {
  nombres: string;
  apellidos: string;
  documentType: 'DNI' | 'CE';
  documentNumber: string;
  phoneMobile: string;
  positionOfInterest: string;
  campaign: string;
  company?: string;
  [key: string]: any;
}

/**
 * Request para registrar un postulante (estructura backend)
 */
export interface RegistrarPostulanteRequest {
  nombres: string;
  apellidos: string;
  tipoDocumento: 'DNI' | 'CE';
  numeroDocumento: string;
  celularPersonal: string;
  compania?: 'ALBRU' | 'WIN' | 'CLARO';
  origen: 'COMPUTRABAJO' | 'INDEED' | 'REFERIDO';
  puestoTrabajo: string;
  [key: string]: any;
}

/**
 * Respuesta del servidor después de registrar postulante
 */
export interface PostulanteResponse {
  id: string;
  nombres: string;
  apellidos: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  celularPersonal?: string;
  email?: string;
  status?: string;
  createdAt?: string;
  [key: string]: any;
}

/**
 * Aplicante - Representación local unificada del postulante
 */
export interface Applicant {
  id: string;
  firstName?: string;
  lastName?: string;
  nombres?: string;
  apellidos?: string;
  email?: string;
  phone?: string;
  phoneMobile?: string;
  status?: string;
  createdAt?: string;
  [key: string]: any;
}

/**
 * Request para evento de postulante
 */
export interface EventoPostulanteRequest {
  postulantId: string;
  eventType: string;
  [key: string]: any;
}

/**
 * Request para estado de capacitación
 */
export interface EstadoCapacitacionRequest {
  postulantId: string;
  status: string;
  [key: string]: any;
}

/**
 * DTO para crear un nuevo empleado (estructura UI)
 */
export interface NewEmployeeFormData {
  nombres: string;
  apellidos: string;
  documentType: 'DNI' | 'CE';
  documentNumber: string;
  phoneMobile: string;
  nationality: string;
  birthDate: string;
  civilStatus: string;
  hasChildren: boolean;
  district: string;
  address: string;
  bank: string;
  accountNumber: string;
  interbankNumber: string;
  baseSalary: string;
  role: string;
  company?: string;
  personalEmail?: string;
  workEmail?: string;
  contractKinship?: string;
  contractCellularTransfer?: string;
  contractorCompany?: string;
  status?: string;
  [key: string]: any;
}

/**
 * DTO para actualizar detalles de empleado
 */
export interface EmployeeDetailFormData {
  id: string;
  nombres?: string;
  apellidos?: string;
  documentNumber?: string;
  phoneMobile?: string;
  status?: string;
  [key: string]: any;
}

/**
 * Alias para registrar un aplicante como empleado
 */
export type HireApplicantFormData = NewEmployeeFormData;

/**
 * Empleado - Personal de la empresa
 */
export interface Employee {
  id: string;
  initials: string;
  fullName?: string;
  nombres?: string;
  apellidos?: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  documentType?: string;
  documentNumber?: string;
  nationality?: string;
  birthDate?: string;
  civilStatus?: string;
  hasChildren?: boolean;
  district?: string;
  address?: string;
  phoneMobile?: string;
  personalEmail?: string;
  bank?: string;
  accountNumber?: string;
  interbankNumber?: string;
  baseSalary?: string;
  startDate?: string;
  endDate?: string;
  modality?: string;
  scheduleType?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

/**
 * Request para registrar un empleado
 */
export interface RegistrarEmpleadoRequest {
  nombres: string;
  apellidos: string;
  documentType: 'DNI' | 'CE';
  documentNumber: string;
  phoneMobile: string;
  [key: string]: any;
}

/**
 * Request para registrar un contrato
 */
export interface RegistrarContratoRequest {
  employeeId: string;
  contractType: string;
  startDate: string;
  endDate?: string;
  [key: string]: any;
}

/**
 * Request para cerrar un contrato
 */
export interface CerrarContratoRequest {
  contractId?: string;
  endDate?: string;
  reason?: string;
  motivoBaja?: string;
  fechaCierre?: string;
  [key: string]: any;
}

/**
 * Respuesta del servidor sobre empleado
 */
export interface EmpleadoResponse {
  id: string;
  nombres?: string;
  apellidos?: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  documentType?: 'DNI' | 'CE';
  documentNumber?: string;
  phoneMobile?: string;
  status?: string;
  email?: string;
  personalEmail?: string;
  [key: string]: any;
}

/**
 * Respuesta genérica paginada
 */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
  [key: string]: any;
}

/**
 * Perfil de usuario para UI
 */
export interface UserProfile {
  id?: string;
  name: string;
  email?: string;
  role: string;
  avatar?: string;
  initials?: string;
  status?: string;
  [key: string]: any;
}

/**
 * Estadística genérica
 */
export interface Statistic {
  label: string;
  value: number;
  change?: number;
  changePercent?: number;
  [key: string]: any;
}

/**
 * Adaptador: Convertir respuesta de empleado a Employee entity
 */
export const adaptEmpleadoResponseToEmployee = (response: EmpleadoResponse): Employee => {
  const firstName = response.firstName ||  response.nombres?.split(' ')[0] || '';
  const lastName = response.lastName || response.apellidos || '';
  return {
    id: response.id,
    nombres: response.nombres,
    apellidos: response.apellidos,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase(),
    position: response.position,
    documentType: response.documentType,
    documentNumber: response.documentNumber,
    status: response.status,
    personalEmail: response.personalEmail || response.email,
    phoneMobile: response.phoneMobile || response.phoneMobile,
  };
};

/**
 * Adaptador: Convertir respuesta de postulante a Applicant entity
 */
export const adaptPostulanteResponseToApplicant = (response: PostulanteResponse): Applicant => {
  const firstName = response.nombres?.split(' ')[0] || '';
  const lastName = response.apellidos || '';
  return {
    id: response.id,
    nombres: response.nombres,
    apellidos: response.apellidos,
    firstName,
    lastName,
    email: response.email,
    phone: response.celularPersonal,
    phoneMobile: response.celularPersonal,
    status: response.status,
  };
};
