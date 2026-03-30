/**
 * GTR Repository - Acceso a datos de Leads
 * Endpoint base: /leads/leads
 * FSD: caracteristicas/gtr/model
 */

import { leadsHttp } from '@shared/api/httpClient';
import type {
  LeadIntakeRequest,
  LeadAsignacionRequest,
  LeadDatosPreventaRequest,
  LeadDireccionRequest,
  LeadOfertaComercialRequest,
  LeadTipificacionRequest,
  LeadAsesorVentasResponse,
  LeadAsesorDetalleResponse,
  LeadGtrResponse,
  EventoResponse,
} from '@entidades/lead/types';

class GtrRepo {
  private readonly baseUrl = '/leads';

  /**
   * POST /leads/intake
   * Alta de nuevo lead
   */
  async createLead(data: LeadIntakeRequest): Promise<void> {
    await leadsHttp.post(`${this.baseUrl}/intake`, data);
  }

  /**
   * PATCH /leads/leads/{idLead}/asignacion
   * Asignar lead a asesor
   */
  async assignLead(idLead: number, data: LeadAsignacionRequest): Promise<void> {
    await leadsHttp.patch(`${this.baseUrl}/${idLead}/asignacion`, data);
  }

  /**
   * GET /leads/leads/asesor-ventas
   * Obtener leads asignados a asesor de ventas
   */
  async getLeadsAsesorVentas(
    filtros?: {
      idAsesor?: number;
      estado?: string;
      fechaDesde?: string;
      fechaHasta?: string;
    }
  ): Promise<LeadAsesorVentasResponse[]> {
    const params = new URLSearchParams();
    if (filtros?.idAsesor) params.append('idAsesor', filtros.idAsesor.toString());
    if (filtros?.estado) params.append('estado', filtros.estado);
    if (filtros?.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
    if (filtros?.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);

    const query = params.toString();
    const url = query ? `${this.baseUrl}/asesor-ventas?${query}` : `${this.baseUrl}/asesor-ventas`;
    const response = await leadsHttp.get<LeadAsesorVentasResponse[]>(url);
    return response.data;
  }

  /**
   * GET /leads/leads/{idLead}/detalle-asesor
   * Obtener detalles de un lead asignado a asesor
   */
  async getLeadDetalleAsesor(idLead: number): Promise<LeadAsesorDetalleResponse> {
    const response = await leadsHttp.get<LeadAsesorDetalleResponse>(
      `${this.baseUrl}/${idLead}/detalle-asesor`
    );
    return response.data;
  }

  /**
   * PATCH /leads/leads/{idLead}/datos-preventa
   * Actualizar datos de preventa del lead
   */
  async updateLeadPreventa(
    idLead: number,
    data: LeadDatosPreventaRequest
  ): Promise<void> {
    await leadsHttp.patch(`${this.baseUrl}/${idLead}/datos-preventa`, data);
  }

  /**
   * PATCH /leads/leads/{idLead}/direccion
   * Actualizar dirección del lead
   */
  async updateLeadDireccion(idLead: number, data: LeadDireccionRequest): Promise<void> {
    await leadsHttp.patch(`${this.baseUrl}/${idLead}/direccion`, data);
  }

  /**
   * PATCH /leads/leads/{idLead}/oferta-comercial
   * Actualizar oferta comercial del lead
   */
  async updateLeadOfertaComercial(
    idLead: number,
    data: LeadOfertaComercialRequest
  ): Promise<void> {
    await leadsHttp.patch(`${this.baseUrl}/${idLead}/oferta-comercial`, data);
  }

  /**
   * POST /leads/leads/{idLead}/tipificacion
   * Tipificar lead (asignar tipificación)
   */
  async typifyLead(idLead: number, data: LeadTipificacionRequest): Promise<void> {
    await leadsHttp.post(`${this.baseUrl}/${idLead}/tipificacion`, data);
  }

  /**
   * POST /leads/leads/{idLead}/contacto
   * Registrar contacto con lead
   */
  async contactLead(idLead: number): Promise<void> {
    await leadsHttp.post(`${this.baseUrl}/${idLead}/contacto`);
  }

  /**
   * GET /leads/gtr
   * Obtener todos los leads para vista GTR
   * (con opción de filtro por fecha)
   */
  async getLeadsGTR(filtros?: { fecha?: string }): Promise<LeadGtrResponse[]> {
    const params = new URLSearchParams();
    if (filtros?.fecha) params.append('fecha', filtros.fecha);

    const query = params.toString();
    const url = query ? `${this.baseUrl}/gtr?${query}` : `${this.baseUrl}/gtr`;
    const response = await leadsHttp.get<LeadGtrResponse[]>(url);
    return response.data;
  }
}

export const GtrRepository = new GtrRepo();
