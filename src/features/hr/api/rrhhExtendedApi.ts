import { http, recruitmentHttp, rrhhHttp } from '@shared/api/httpClient';

export interface RrhhPostulacion {
  id: number;
  etapaProceso?: string;
  estadoProceso?: string;
  codigoTipificacion?: string | null;
  tipificacion?: { codigo?: string | null } | null;
  postulante?: {
    nombres?: string;
    apellidos?: string;
    documento?: string;
  };
  [key: string]: unknown;
}

export interface RrhhEventoPostulacion {
  id: number;
  etapa?: string;
  descripcion?: string;
  tipificacion?: string;
  codigoTipificacion?: string;
  subtipificacion?: string;
  modalidadContacto?: string;
  observacion?: string;
  accion?: string;
  createdAt?: string;
  fecha?: string;
  [key: string]: unknown;
}

export interface RrhhEmpleado {
  id: number;
  nombres?: string;
  apellidos?: string;
  numeroDocumento?: string;
  puesto?: string;
  compania?: string;
  estado?: string;
  [key: string]: unknown;
}

export interface RrhhContrato {
  id?: number;
  idEmpleado?: number;
  puestoTrabajo?: string;
  regimen?: string;
  modalidad?: string;
  seguroSalud?: string;
  sistemaPensiones?: string;
  sueldoBase?: number;
  fechaInicio?: string;
  fechaFin?: string;
  [key: string]: unknown;
}

export interface RrhhEmpresaContratista {
  id: number;
  nombre: string;
  activo: boolean;
  createdAt?: string;
  [key: string]: unknown;
}

interface PageResponse<T> {
  content?: T[];
  items?: T[];
}

const unwrapArray = <T>(payload: T[] | PageResponse<T> | null | undefined): T[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
};

const normalizeContrato = (contrato: any): RrhhContrato => ({
  id: contrato.id ?? contrato.idContrato ?? contrato.id_contrato,
  idEmpleado: contrato.idEmpleado ?? contrato.id_empleado,
  puestoTrabajo: contrato.puestoTrabajo ?? contrato.puesto_trabajo,
  sueldoBase: contrato.sueldoBase ?? contrato.sueldo_base,
  fechaInicio: contrato.fechaInicio ?? contrato.fecha_inicio,
  fechaFin: contrato.fechaFin ?? contrato.fecha_fin,
  regimen: contrato.regimen,
  modalidad: contrato.modalidad,
  seguroSalud: contrato.seguroSalud ?? contrato.seguro_salud,
  sistemaPensiones: contrato.sistemaPensiones ?? contrato.sistema_pensiones,
  ...contrato,
});

export async function getBandejaContratacion(): Promise<RrhhPostulacion[]> {
  const response = await recruitmentHttp.get<RrhhPostulacion[]>('/postulaciones/bandeja/contratacion');
  return unwrapArray(response.data);
}

export async function getEmpresasContratistas(): Promise<RrhhEmpresaContratista[]> {
  const response = await rrhhHttp.get<RrhhEmpresaContratista[] | PageResponse<RrhhEmpresaContratista>>('/empresas-contratistas');
  return unwrapArray(response.data);
}

export async function getPostulacionEventos(postulacionId: number): Promise<RrhhEventoPostulacion[]> {
  const response = await recruitmentHttp.get<RrhhEventoPostulacion[]>(`/postulaciones/${postulacionId}/eventos`);
  return unwrapArray(response.data);
}

export async function confirmarContratacion(postulacionId: number, payload: { idEmpleadoContratado: number; fechaContratacion: string; }) {
  const response = await recruitmentHttp.post(`/postulaciones/${postulacionId}/confirmar-contratacion`, payload);
  return response.data;
}

export async function getEmpleadoByDocumento(documento: string): Promise<RrhhEmpleado | null> {
  const response = await http.get<RrhhEmpleado>(`/empleados/${documento}/numero-documento`, {
    suppressErrorLog: true,
    validateStatus: (status: number) => status === 200 || status === 404,
  } as any);
  return response.status === 404 ? null : response.data;
}

export async function createEmpleado(payload: Record<string, unknown>): Promise<RrhhEmpleado> {
  const response = await http.post<RrhhEmpleado>('/empleados', payload);
  return response.data;
}

export async function getEmpleados(params?: Record<string, string | number>): Promise<RrhhEmpleado[]> {
  const response = await http.get<PageResponse<RrhhEmpleado> | RrhhEmpleado[]>('/empleados', { params });
  return unwrapArray(response.data);
}

export async function getPersonalRecruitment(): Promise<RrhhEmpleado[]> {
  const response = await http.get<RrhhEmpleado[]>('/empleados/personal-recruitment');
  return unwrapArray(response.data);
}

export async function searchEmpleadosUniversal(dato: string): Promise<RrhhEmpleado[]> {
  const response = await http.get<PageResponse<RrhhEmpleado> | RrhhEmpleado[]>(`/empleados/${dato}/universal`);
  return unwrapArray(response.data);
}

export async function patchEmpleadoDatosPersonales(id: number, payload: Record<string, unknown>) {
  const response = await http.patch(`/empleados/${id}/datos-personales`, payload);
  return response.data;
}

export async function patchEmpleadoDatosFinancieros(id: number, payload: Record<string, unknown>) {
  const response = await http.patch(`/empleados/${id}/datos-financieros`, payload);
  return response.data;
}

export async function patchEmpleadoDatosCorporativos(id: number, payload: Record<string, unknown>) {
  const response = await http.patch(`/empleados/${id}/datos-corporativos`, payload);
  return response.data;
}

export async function patchEmpleadoDatosContactoUbicacion(id: number, payload: Record<string, unknown>) {
  try {
    const response = await http.patch(`/empleados/${id}/datos-contacto-ubicación`, payload);
    return response.data;
  } catch {
    const fallback = await http.patch(`/empleados/${id}/datos-contacto-ubicacion`, payload);
    return fallback.data;
  }
}

export async function patchEmpleadoListaNegra(id: number, payload: { listaNegra: boolean; observacion?: string }) {
  const response = await http.patch(`/empleados/${id}/lista-negra`, payload);
  return response.data;
}

export async function getEventosEmpleado(idEmpleado: number): Promise<Array<Record<string, unknown>>> {
  const response = await http.get<Array<Record<string, unknown>>>(`/eventos/${idEmpleado}/empleados`);
  return unwrapArray(response.data);
}

export async function registrarContrato(idEmpleado: number, payload: Record<string, unknown>) {
  const response = await rrhhHttp.post(`/contratos/${idEmpleado}/registrar`, payload);
  return response.data;
}

export async function getContratoVigente(idEmpleado: number): Promise<RrhhContrato> {
  const response = await rrhhHttp.get<RrhhContrato>(`/contratos/${idEmpleado}/vigente`);
  return normalizeContrato(response.data);
}

export async function getContratoHistorico(idEmpleado: number): Promise<RrhhContrato[]> {
  const response = await rrhhHttp.get<RrhhContrato[] | { contratos?: RrhhContrato[] }>(`/contratos/${idEmpleado}/historico`);
  const data = response.data;
  const raw = Array.isArray(data) ? data : Array.isArray(data?.contratos) ? data.contratos : [];
  return raw.map(normalizeContrato);
}

export async function cesarContrato(idContrato: number, payload: { fechaFin: string }) {
  const response = await rrhhHttp.patch(`/contratos/${idContrato}/cesar-contrato`, payload);
  return response.data;
}
