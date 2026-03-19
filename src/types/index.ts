/**
 * Tipos e interfaces globales de la aplicación
 */

// Employee Status Types
export type EmployeeStatus = 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';

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
  // contract details (added for new employee creation)
  contractRegimen?: string;
  contractModalidad?: string;
  contractSeguro?: string;
  contractPension?: string;
  contractOwnAccount?: string; // Sí o No
  contractKinship?: string; // PADRE, MADRE, TÍO/A, ESPOSO/A, HERMANO/A, ABUELO/A, PAREJA, OTRO
  contractCellularTransfer?: string; // 9 dígitos
  contractorCompany?: 'ALBRU' | 'RUNA';
  dismissalReason?: string; // motivo de baja cuando status = 'INACTIVO'
}

export interface Statistic {
  label: string;
  value: number;
  percentage?: number;
  icon?: string;
  color?: string;
}

export interface Applicant {
  id: string;
  fullName: string;
  nombres?: string;
  apellidos?: string;
  phoneMobile: string;
  documentType: string;
  documentNumber: string;
  nationality?: string;
  birthDate?: string;
  civilStatus?: string;
  hasChildren?: boolean;
  personalEmail?: string;
  district?: string;
  address?: string;
  bank?: string;
  accountNumber?: string;
  interbankNumber?: string;
  positionOfInterest: string;
  modality: string;
  campaign: string;
  company?: string; // CLARO | WIN
  status?: string;
  trainingDayPayment?: number;
  startDate?: string;
  endDate?: string;
  rejectionReason?: string; // motivo de rechazo cuando status = 'RECHAZADO'
  meetingDate?: string; // fecha y hora del meet cuando status = 'INTERESADO'

  // datos de contrato cuando se ha contratado
  contractRegimen?: 'RECIBO POR HONORARIOS' | 'PLANILLA';
  contractModalidad?: 'PART TIME' | 'SEMI FULL' | 'FULL TIME' | 'SUPER FULL';
  contractSeguro?: 'SIS' | 'ESSALUD';
  contractPension?:
    | 'ONP'
    | 'AFP INTEGRA'
    | 'PROFUTURO AFP'
    | 'AFP HABITAD'
    | 'PRIMA AFP';
  contractSalary?: number;
  contractStartDate?: string;
  contractPosition?: string;
  contractCampaign?: string;
  contractCompany?: string;
  contractOwnAccount?: string; // Sí o No
  contractKinship?: string; // PADRE, MADRE, TÍO/A, ESPOSO/A, HERMANO/A, ABUELO/A, PAREJA, OTRO
  contractCellularTransfer?: string; // 9 dígitos
  contractorCompany?: 'ALBRU' | 'RUNA';
  dismissalReason?: string; // motivo de baja cuando status = 'INACTIVO'
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
  phoneMobile: string;
  bank: string;
  accountNumber: string;
  interbankNumber: string;
  baseSalary: string;
  role: string;
  company?: string;
  startDate: string;
  endDate?: string;
  modality: string;
  scheduleType: string;
  personalEmail?: string;
  campaign?: string;
  // contract-only fields
  regimen?: string;
  seguro?: string;
  pension?: string;
  contractOwnAccount?: string;
  contractKinship?: string;
  contractCellularTransfer?: string;
  contractorCompany?: string;
}

export interface NewApplicantFormData {
  nombres: string;
  apellidos: string;
  phoneMobile: string;
  documentType: 'DNI' | 'CE';
  documentNumber: string;
  positionOfInterest: string;
  company?: string; // CLARO | WIN (may be omitted when no company is needed)
  campaign: string;
}

export interface EditApplicantFormData extends NewApplicantFormData {
  id: string;
}

export interface HireApplicantFormData extends NewEmployeeFormData {
  applicantId: string;
  personalEmail?: string;
}

// form data used when viewing or editing an employee; allow any subset of the
// full employee record so the detail view can operate on whatever fields are
// present and we don't need to keep two almost‑identical interfaces in sync.
export type EmployeeDetailFormData = Partial<Employee>;

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


// Request payloads para API - Postulantes
export interface RegistrarPostulanteRequest {
  nombres: string;
  apellidos: string;
  tipoDocumento: 'DNI' | 'CE';
  numeroDocumento: string;
  celularPersonal: string;
  puestoTrabajo: string;
  compania: 'ALBRU' | 'WIN' | 'CLARO';
  origen: 'COMPUTRABAJO' | 'INDEED' | 'REFERIDO' | 'TIKTOK' | 'FACEBOOK' | 'LINKEDIN';
}

export interface EventoPostulanteRequest {
  evento: string; // ej: 'APROBAR', 'RECHAZAR', 'CONTRATAR'
  nota?: string;
  fechaEvento?: string;
}

export interface EstadoCapacitacionRequest {
  postulante_id: number;
  nuevo_estado: string;
  evento?: string;
}

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

// Request payloads para API - Empleados y Contratos
export interface RegistrarEmpleadoRequest {
  nombres: string;
  apellidos: string;
  tipoDocumento: 'DNI' | 'CE';
  numeroDocumento: string;
  nacionalidad: string;
  fechaNacimiento: string;
  estadoCivil: string;
  tieneHijos: boolean;
  distrito: string;
  direccion: string;
  celularPersonal: string;
  correoPersonal: string;
  banco: string;
  cuentaBancaria: string;
  cuentaInterbancaria: string;
  sueldo: number;
  puestoTrabajo: string;
  fechaInicio: string;
  fechaFin?: string;
  modalidad: string;
  regimen: 'RECIBO POR HONORARIOS' | 'PLANILLA';
  compania?: 'CLARO' | 'WIN' | 'ALBRU';
  campana?: string;
  // contract fields
  seguro?: 'SIS' | 'ESSALUD';
  pension?: 'ONP' | 'AFP INTEGRA' | 'PROFUTURO AFP' | 'AFP HABITAD' | 'PRIMA AFP';
  cuentaPropia?: boolean;
  parentesco?: string;
  celularTransferencia?: string;
  empresaContratista?: 'ALBRU' | 'RUNA';
}

export interface RegistrarContratoRequest {
  regimen: 'RECIBO POR HONORARIOS' | 'PLANILLA';
  modalidad: 'PART TIME' | 'SEMI FULL' | 'FULL TIME' | 'SUPER FULL';
  seguro?: 'SIS' | 'ESSALUD';
  pension?: 'ONP' | 'AFP INTEGRA' | 'PROFUTURO AFP' | 'AFP HABITAD' | 'PRIMA AFP';
  sueldo: number;
  fechaInicio: string;
  puestoTrabajo: string;
  compania?: string;
  // Beneficiario
  cuentaPropia: boolean;
  parentesco: string;
  celularTransferencia: string;
  empresaContratista?: 'ALBRU' | 'RUNA';
}

export interface CerrarContratoRequest {
  motivoBaja: string;
  fechaCierre?: string;
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
  baseSalary: '', // No disponible
});

export const adaptPostulanteResponseToApplicant = (backend: PostulanteResponse): Applicant => {
  // normalizar algunos estados para la UI
  let status = backend.estadoPostulacion;
  if (status === 'EN_PROCESO' || status === 'POSTULANTE') {
    status = 'POR_RECLUTAR';
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

