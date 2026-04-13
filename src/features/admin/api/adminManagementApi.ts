import { rrhhHttp } from '@shared/api/httpClient';

export interface EmpresaContratista {
  id: number;
  nombre: string;
  activo: boolean;
  createdAt: string;
  [key: string]: unknown;
}

export interface PagoContrato {
  id: number;
  idContrato?: number;
  idEmpleado?: number;
  estado?: string;
  monto?: number;
  fechaPago?: string;
  [key: string]: unknown;
}

export interface RegistrarPagoRequest {
  fechaInicio: string;
  fechaFin: string;
  asignacionFamiliar: number;
  bonoPuntualidad: number;
  comisionSemanal: number;
  comisionMensual: number;
  bonoExtra: number;
}

interface ListResponse<T> {
  content?: T[];
  items?: T[];
  data?: T[];
}

const normalizeList = <T>(payload: T[] | ListResponse<T> | null | undefined): T[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

export async function getEmpresasContratistas(): Promise<EmpresaContratista[]> {
  const response = await rrhhHttp.get<EmpresaContratista[] | ListResponse<EmpresaContratista>>('/empresas-contratistas');
  return normalizeList(response.data);
}

export async function createEmpresaContratista(payload: {
  nombre: string;
}): Promise<EmpresaContratista> {
  const response = await rrhhHttp.post<EmpresaContratista>('/empresas-contratistas', payload);
  return response.data;
}

export async function desactivarEmpresaContratista(id: number): Promise<EmpresaContratista> {
  const response = await rrhhHttp.patch<EmpresaContratista>(`/empresas-contratistas/${id}/desactivar`);
  return response.data;
}

export async function getPagos(): Promise<PagoContrato[]> {
  const response = await rrhhHttp.get<PagoContrato[] | ListResponse<PagoContrato>>('/pagos');
  return normalizeList(response.data);
}

export async function pagarContrato(idPago: number, payload: RegistrarPagoRequest): Promise<PagoContrato> {
  const response = await rrhhHttp.post<PagoContrato>(`/pagos/${idPago}/pagar-contrato`, payload);
  return response.data;
}
