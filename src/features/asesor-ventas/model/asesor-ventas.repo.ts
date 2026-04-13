import { leadsHttp } from '@shared/api';
import type {
  LeadAsesorVentasResponse,
  ContactoRequest,
  ContactoResponse,
  TipificacionRequest,
  OfertaComercialRequest,
  OfertaResponse,
  DireccionRequest,
  DireccionResponse,
  DatosPreventa,
  DatosPreventaResponse,
} from './asesor-ventas.types';

/**
 * ASESOR_VENTAS Repository
 * Gestiona los 6 endpoints específicos para asesor de ventas:
 * - GET /leads/asesor-ventas
 * - POST /leads/{idLead}/contacto
 * - POST /leads/{idLead}/tipificacion
 * - PATCH /leads/{idLead}/oferta-comercial
 * - PATCH /leads/{idLead}/direccion
 * - PATCH /leads/{idLead}/datos-preventa
 */
export class AsesorVentasRepository {
  private static readonly baseUrl = '/leads';

  /**
   * GET /leads/asesor-ventas
   * Obtiene la bandeja de leads asignados al asesor actual
   */
  static async getBandejaLeads(): Promise<LeadAsesorVentasResponse[]> {
    const response = await leadsHttp.get<LeadAsesorVentasResponse[]>(
      `${this.baseUrl}/asesor-ventas`,
    );
    return response.data;
  }

  /**
   * POST /leads/{idLead}/contacto
   * Registra un contacto realizado con el cliente
   */
  static async registrarContacto(
    idLead: number,
    payload: ContactoRequest
  ): Promise<ContactoResponse> {
    const response = await leadsHttp.post<ContactoResponse>(
      `${this.baseUrl}/${idLead}/contacto`,
      payload
    );
    return response.data;
  }

  /**
   * POST /leads/{idLead}/tipificacion
   * Tipifica el lead según el resultado del contacto
   */
  static async tipificarLead(
    idLead: number,
    payload: TipificacionRequest
  ): Promise<{ success: boolean; message: string }> {
    const response = await leadsHttp.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/${idLead}/tipificacion`,
      payload
    );
    return response.data;
  }

  /**
   * PATCH /leads/{idLead}/oferta-comercial
   * Actualiza la oferta comercial para el lead
   */
  static async actualizarOfertaComercial(
    idLead: number,
    payload: OfertaComercialRequest
  ): Promise<OfertaResponse> {
    const response = await leadsHttp.patch<OfertaResponse>(
      `${this.baseUrl}/${idLead}/oferta-comercial`,
      payload
    );
    return response.data;
  }

  /**
   * PATCH /leads/{idLead}/direccion
   * Actualiza la dirección del cliente
   */
  static async actualizarDireccion(
    idLead: number,
    payload: DireccionRequest
  ): Promise<DireccionResponse> {
    const response = await leadsHttp.patch<DireccionResponse>(
      `${this.baseUrl}/${idLead}/direccion`,
      payload
    );
    return response.data;
  }

  /**
   * PATCH /leads/{idLead}/datos-preventa
   * Actualiza los datos de preventa (información personal del cliente)
   */
  static async actualizarDatosPreventa(
    idLead: number,
    payload: DatosPreventa
  ): Promise<DatosPreventaResponse> {
    const response = await leadsHttp.patch<DatosPreventaResponse>(
      `${this.baseUrl}/${idLead}/datos-preventa`,
      payload
    );
    return response.data;
  }
}
