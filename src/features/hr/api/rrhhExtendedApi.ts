import { http, recruitmentHttp, rrhhHttp } from '@shared/api/httpClient';
import type { AxiosRequestConfig } from 'axios';
import { isObject, hasProperty, isArray, isNumber, isString } from '@shared/lib/type-guards';
import { getErrorMessage } from '@shared/lib/error-utils';

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
}

export interface RrhhEmpleado {
  id: number;
  nombres?: string;
  apellidos?: string;
  numeroDocumento?: string;
  puesto?: string;
  compania?: string;
  estado?: string;
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
}

export interface RrhhEmpresaContratista {
  id: number;
  nombre: string;
  activo: boolean;
  createdAt?: string;
}

interface PageResponse<T> {
  content?: T[];
  items?: T[];
}

type RrhhRequestConfig = AxiosRequestConfig & {
  suppressErrorLog?: boolean;
};

const unwrapArray = <T>(payload: T[] | PageResponse<T> | null | undefined): T[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || !isObject(payload)) return [];
  
  if (hasProperty(payload, 'content') && isArray(payload.content)) {
    return payload.content as T[];
  }
  if (hasProperty(payload, 'items') && isArray(payload.items)) {
    return payload.items as T[];
  }
  
  return [];
};

// ✅ CORREGIDO: Usar type guards para validación segura
const normalizeContrato = (contrato: unknown): RrhhContrato => {
  if (!isObject(contrato)) {
    return {};
  }

  const getNumberValue = (key: string): number | undefined => {
    const value = contrato[key];
    return isNumber(value) ? value : undefined;
  };

  const getStringValue = (key: string): string | undefined => {
    const value = contrato[key];
    return isString(value) ? value : undefined;
  };

  return {
    id: getNumberValue('id') ?? getNumberValue('idContrato') ?? getNumberValue('id_contrato'),
    idEmpleado: getNumberValue('idEmpleado') ?? getNumberValue('id_empleado'),
    puestoTrabajo: getStringValue('puestoTrabajo') ?? getStringValue('puesto_trabajo'),
    sueldoBase: getNumberValue('sueldoBase') ?? getNumberValue('sueldo_base'),
    fechaInicio: getStringValue('fechaInicio') ?? getStringValue('fecha_inicio'),
    fechaFin: getStringValue('fechaFin') ?? getStringValue('fecha_fin'),
    regimen: getStringValue('regimen'),
    modalidad: getStringValue('modalidad'),
    seguroSalud: getStringValue('seguroSalud') ?? getStringValue('seguro_salud'),
    sistemaPensiones: getStringValue('sistemaPensiones') ?? getStringValue('sistema_pensiones'),
  };
};

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
  const requestConfig: RrhhRequestConfig = {
    suppressErrorLog: true,
    validateStatus: (status: number) => status === 200 || status === 404,
  };

  const response = await http.get<RrhhEmpleado>(`/empleados/${documento}/numero-documento`, {
    ...requestConfig,
  });
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
  } catch (error) {
    console.warn('Endpoint con tilde falló, intentando sin tilde:', getErrorMessage(error));
    const fallback = await http.patch(`/empleados/${id}/datos-contacto-ubicacion`, payload);
    return fallback.data;
  }
}

export async function patchEmpleadoListaNegra(id: number, payload: { listaNegra: boolean; observacion?: string }) {
  const response = await http.patch(`/empleados/${id}/lista-negra`, payload);
  return response.data;
}

export async function getEventosEmpleado(idEmpleado: number): Promise<Array<Record<string, unknown>>> {
  const response = await http.get<unknown>(`/eventos/${idEmpleado}/empleados`);
  const data = Array.isArray(response.data) ? response.data : [];
  return data.filter(isObject);
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
  const response = await rrhhHttp.get<unknown>(`/contratos/${idEmpleado}/historico`);
  const data = response.data;
  
  let raw: unknown[] = [];
  if (isArray(data)) {
    raw = data;
  } else if (isObject(data) && hasProperty(data, 'contratos') && isArray(data.contratos)) {
    raw = data.contratos;
  }
  
  return raw.map(normalizeContrato);
}

export async function cesarContrato(idContrato: number, payload: { fechaFin: string }) {
  const response = await rrhhHttp.patch(`/contratos/${idContrato}/cesar-contrato`, payload);
  return response.data;
}
// ✅ CORREGIDO: Solo una llave de cierre al final