import { leadsHttp } from '@shared/api/clienteHttp';
import type {
  CampanaResponse,
  CuentaPublicitariaResponse,
  EventoResponse,
  PlanResponse,
  PromocionComercialResponse,
  AdicionalResponse,
  ServiciosProveedorResponse,
  ProveedorResponse,
} from '@shared/types';

export class LeadsRepository {
  static async getCampanas(): Promise<CampanaResponse[]> {
    const response = await leadsHttp.get<CampanaResponse[]>('/campanas');
    return response.data;
  }

  static async createCampana(payload: Partial<CampanaResponse>): Promise<CampanaResponse> {
    const response = await leadsHttp.post<CampanaResponse>('/campanas', payload);
    return response.data;
  }

  static async updateCampana(id: number, payload: Partial<CampanaResponse>): Promise<CampanaResponse> {
    const response = await leadsHttp.put<CampanaResponse>(`/campanas/${id}`, payload);
    return response.data;
  }

  static async deleteCampana(id: number): Promise<void> {
    await leadsHttp.delete(`/campanas/${id}`);
  }

  static async getCuentasPublicitarias(activo?: boolean): Promise<CuentaPublicitariaResponse[]> {
    const response = await leadsHttp.get<CuentaPublicitariaResponse[]>('/cuentas-publicitarias', {
      params: { activo },
    });
    return response.data;
  }

  static async getEventosPorLead(idLead: number): Promise<EventoResponse[]> {
    const response = await leadsHttp.get<EventoResponse[]>(`/eventos/lead/${idLead}`);
    return response.data;
  }

  static async getEventosPorEmpleado(idEmpleado: number): Promise<EventoResponse[]> {
    const response = await leadsHttp.get<EventoResponse[]>(`/eventos/empleado/${idEmpleado}`);
    return response.data;
  }

  static async createPlan(payload: Partial<PlanResponse>): Promise<PlanResponse> {
    const response = await leadsHttp.post<PlanResponse>('/planes', payload);
    return response.data;
  }

  static async getPlanes(params?: Record<string, unknown>): Promise<PlanResponse[]> {
    const response = await leadsHttp.get<PlanResponse[]>('/planes', { params });
    return response.data;
  }

  static async createPromocion(payload: Partial<PromocionComercialResponse>): Promise<PromocionComercialResponse> {
    const response = await leadsHttp.post<PromocionComercialResponse>('/promociones', payload);
    return response.data;
  }

  static async getProveedores(): Promise<ProveedorResponse[]> {
    const response = await leadsHttp.get<ProveedorResponse[]>('/proveedores');
    return response.data;
  }

  static async getServiciosProveedor(idProveedor: number): Promise<ServiciosProveedorResponse> {
    const response = await leadsHttp.get<ServiciosProveedorResponse>(`/proveedores/${idProveedor}/servicios`);
    return response.data;
  }

  static async getAdicionales(): Promise<AdicionalResponse[]> {
    const response = await leadsHttp.get<AdicionalResponse[]>('/planes/adicionales');
    return response.data;
  }
}