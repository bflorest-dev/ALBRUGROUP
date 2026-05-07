import { leadsHttp } from '@shared/api/httpClient';
import type {
  CampanaResponse,
  CampanaRequest,
  CuentaPublicitariaResponse,
  CuentaPublicitariaRequest,
  EventoResponse,
  PlanResponse,
  PlanRequest,
  PlanUpdateRequest,
  PromocionComercialResponse,
  PromocionComercialRequest,
  AdicionalResponse,
  AdicionalRequest,
  ServiciosProveedorResponse,
  ProveedorResponse,
  ProveedorRequest,
  LeadAsesorVentasResponse,
  LeadAsesorDetalleResponse,
  LeadGtrResponse,
  LeadIntakeRequest,
  LeadAsignacionRequest,
  LeadDatosPreventaRequest,
  LeadDireccionRequest,
  LeadOfertaComercialRequest,
  LeadTipificacionRequest,
  LeadContactoRequest,
  DepartamentoResponse,
  ProvinciaResponse,
  DistritoResponse,
  ZonaResponse,
  ZonaRequest,
  CatalogoResponse,
  CatalogoRequest,
  CatalogoEstadoRequest,
} from '@shared/types';
import {
  leadCommandResponseSchema,
  adicionalResponseArraySchema,
  adicionalResponseSchema,
  campanaResponseArraySchema,
  campanaResponseSchema,
  catalogoResponseSchema,
  cuentaPublicitariaResponseArraySchema,
  cuentaPublicitariaResponseSchema,
  departamentoResponseArraySchema,
  distritoResponseArraySchema,
  eventoResponseArraySchema,
  leadAsesorDetalleResponseSchema,
  leadAsesorVentasResponseArraySchema,
  leadGtrResponseArraySchema,
  parseApiResponse,
  planResponseArraySchema,
  planResponseSchema,
  promocionComercialResponseArraySchema,
  promocionComercialResponseSchema,
  provinciaResponseArraySchema,
  proveedorResponseArraySchema,
  proveedorResponseSchema,
  serviciosProveedorResponseSchema,
  zonaResponseArraySchema,
  zonaResponseSchema,
} from '@shared/api/responseSchemas';

/**
 * Repositorio para Lead Service
 * Consumidor de endpoints: /leads/*
 */
export class LeadsRepository {
  private static parseLeadCommandPayload(payload: unknown, context: string): void {
    if (payload === null || payload === undefined || payload === '') {
      return;
    }

    parseApiResponse(leadCommandResponseSchema, payload, context);
  }

  private static normalizeLeadGtrList(payload: unknown): unknown[] {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (!payload || typeof payload !== 'object') {
      return [];
    }

    const wrapped = payload as Record<string, unknown>;
    const candidates = [wrapped.data, wrapped.content, wrapped.items, wrapped.results];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }

      if (candidate && typeof candidate === 'object') {
        const nested = candidate as Record<string, unknown>;
        if (Array.isArray(nested.content)) {
          return nested.content;
        }
      }
    }

    return [];
  }

  // ========================================================================
  // CAMPAÑAS
  // ========================================================================

  static async getCampanas(activo?: boolean): Promise<CampanaResponse[]> {
    const response = await leadsHttp.get<CampanaResponse[]>('/campanas', {
      params: activo !== undefined ? { activo } : undefined,
    });
    return parseApiResponse(campanaResponseArraySchema, response.data, 'GET /campanas');
  }

  static async createCampana(payload: CampanaRequest): Promise<CampanaResponse> {
    const response = await leadsHttp.post<CampanaResponse>('/campanas', payload);
    return parseApiResponse(campanaResponseSchema, response.data, 'POST /campanas');
  }

  static async updateCampana(
    id: number,
    payload: Partial<CampanaRequest>,
  ): Promise<CampanaResponse> {
    const response = await leadsHttp.put<CampanaResponse>(`/campanas/${id}`, payload);
    return parseApiResponse(campanaResponseSchema, response.data, 'PUT /campanas/{id}');
  }

  static async deleteCampana(id: number): Promise<CampanaResponse> {
    const response = await leadsHttp.delete<CampanaResponse>(`/campanas/${id}`);
    return parseApiResponse(campanaResponseSchema, response.data, 'DELETE /campanas/{id}');
  }

  // ========================================================================
  // CUENTAS PUBLICITARIAS
  // ========================================================================

  static async getCuentasPublicitarias(activo?: boolean): Promise<CuentaPublicitariaResponse[]> {
    const response = await leadsHttp.get<CuentaPublicitariaResponse[]>('/cuentas-publicitarias', {
      params: activo !== undefined ? { activo } : undefined,
    });
    return parseApiResponse(
      cuentaPublicitariaResponseArraySchema,
      response.data,
      'GET /cuentas-publicitarias',
    );
  }

  static async getCuentasPublicitariasActivas(): Promise<CuentaPublicitariaResponse[]> {
    const response = await leadsHttp.get<CuentaPublicitariaResponse[]>(
      '/cuentas-publicitarias/activas',
    );
    return parseApiResponse(
      cuentaPublicitariaResponseArraySchema,
      response.data,
      'GET /cuentas-publicitarias/activas',
    );
  }

  static async createCuentaPublicitaria(
    payload: CuentaPublicitariaRequest,
  ): Promise<CuentaPublicitariaResponse> {
    const response = await leadsHttp.post<CuentaPublicitariaResponse>(
      '/cuentas-publicitarias',
      payload,
    );
    return parseApiResponse(
      cuentaPublicitariaResponseSchema,
      response.data,
      'POST /cuentas-publicitarias',
    );
  }

  static async deleteCuentaPublicitaria(
    id: number,
  ): Promise<CuentaPublicitariaResponse> {
    const response = await leadsHttp.delete<CuentaPublicitariaResponse>(
      `/cuentas-publicitarias/${id}`,
    );
    return parseApiResponse(
      cuentaPublicitariaResponseSchema,
      response.data,
      'DELETE /cuentas-publicitarias/{id}',
    );
  }

  // ========================================================================
  // LEADS - Operaciones Principales
  // ========================================================================

  /**
   * Registra un nuevo lead (Intake)
   * POST /preventa/intake
   */
  static async intakeLead(payload: LeadIntakeRequest): Promise<void> {
    const response = await leadsHttp.post('/preventa/intake', payload);
    this.parseLeadCommandPayload(response.data, 'POST /preventa/intake');
  }

  /**
   * Asigna un lead a un asesor
   * PATCH /preventa/{idLead}/asignacion
   */
  static async asignarLead(
    idLead: number,
    payload: LeadAsignacionRequest,
  ): Promise<void> {
    const response = await leadsHttp.patch(`/preventa/${idLead}/asignacion`, payload);
    this.parseLeadCommandPayload(response.data, 'PATCH /preventa/{idLead}/asignacion');
  }

  /**
   * Obtiene la bandeja de leads asignados al asesor actual
   * GET /preventa/asesor-ventas
   */
  static async getBandejaAsesor(): Promise<LeadAsesorVentasResponse[]> {
    const response = await leadsHttp.get<LeadAsesorVentasResponse[]>(
      '/preventa/asesor-ventas',
    );
    return parseApiResponse(
      leadAsesorVentasResponseArraySchema,
      this.normalizeLeadGtrList(response.data),
      'GET /preventa/asesor-ventas',
    );
  }

  /**
   * Obtiene detalle del lead para asesor de ventas
   * GET /preventa/{idLead}/detalle-asesor
   */
  static async getDetalleAsesor(idLead: number): Promise<LeadAsesorDetalleResponse> {
    const response = await leadsHttp.get<LeadAsesorDetalleResponse>(
      `/preventa/${idLead}/detalle-asesor`,
    );
    return parseApiResponse(
      leadAsesorDetalleResponseSchema,
      response.data,
      'GET /preventa/{idLead}/detalle-asesor',
    );
  }

  /**
   * Actualiza datos de preventa del lead
   * PATCH /preventa/{idLead}/datos-preventa
   */
  static async updateDatosPreventa(
    idLead: number,
    payload: LeadDatosPreventaRequest,
  ): Promise<void> {
    const response = await leadsHttp.patch(`/preventa/${idLead}/datos-preventa`, payload);
    this.parseLeadCommandPayload(response.data, 'PATCH /preventa/{idLead}/datos-preventa');
  }

  /**
   * Actualiza dirección del lead
   * PATCH /preventa/{idLead}/direccion
   */
  static async updateDireccion(
    idLead: number,
    payload: LeadDireccionRequest,
  ): Promise<void> {
    const response = await leadsHttp.patch(`/preventa/${idLead}/direccion`, payload);
    this.parseLeadCommandPayload(response.data, 'PATCH /preventa/{idLead}/direccion');
  }

  /**
   * Actualiza oferta comercial del lead
   * PATCH /preventa/{idLead}/oferta-comercial
   */
  static async updateOfertaComercial(
    idLead: number,
    payload: LeadOfertaComercialRequest,
  ): Promise<void> {
    const response = await leadsHttp.patch(`/preventa/${idLead}/oferta-comercial`, payload);
    this.parseLeadCommandPayload(response.data, 'PATCH /preventa/{idLead}/oferta-comercial');
  }

  /**
   * Tipifica el lead (cierre de venta)
   * POST /preventa/{idLead}/tipificacion
   */
  static async tipificarLead(
    idLead: number,
    payload: LeadTipificacionRequest,
  ): Promise<void> {
    const response = await leadsHttp.post(`/preventa/${idLead}/tipificacion`, payload);
    this.parseLeadCommandPayload(response.data, 'POST /preventa/{idLead}/tipificacion');
  }

  /**
   * Registra contacto/interacción con el lead
   * POST /preventa/{idLead}/contacto
   */
  static async registrarContacto(idLead: number, payload?: LeadContactoRequest): Promise<void> {
    const response = await leadsHttp.post(`/preventa/${idLead}/contacto`, payload);
    this.parseLeadCommandPayload(response.data, 'POST /preventa/{idLead}/contacto');
  }

  /**
   * Obtiene bandeja de leads para GTR
   * GET /preventa/gtr
   */
  static async getBandejaGtr(params?: Record<string, unknown>): Promise<LeadGtrResponse[]> {
    const response = await leadsHttp.get<LeadGtrResponse[]>('/preventa/gtr', { params });
    return parseApiResponse(
      leadGtrResponseArraySchema,
      this.normalizeLeadGtrList(response.data),
      'GET /preventa/gtr',
    );
  }

  // ========================================================================
  // EVENTOS DE LEAD
  // ========================================================================

  static async getEventosPorLead(idLead: number): Promise<EventoResponse[]> {
    const response = await leadsHttp.get<EventoResponse[]>(`/eventos/lead/${idLead}`);
    return parseApiResponse(
      eventoResponseArraySchema,
      this.normalizeLeadGtrList(response.data),
      'GET /eventos/lead/{idLead}'
    );
  }

  static async getEventosPorEmpleado(
    idEmpleado: number,
    params?: Record<string, unknown>,
  ): Promise<EventoResponse[]> {
    const response = await leadsHttp.get<EventoResponse[]>(`/eventos/empleado/${idEmpleado}`, {
      params,
    });
    return parseApiResponse(
      eventoResponseArraySchema,
      this.normalizeLeadGtrList(response.data),
      response.data,
      'GET /eventos/empleado/{idEmpleado}',
    );
  }

  // ========================================================================
  // PLANES
  // ========================================================================

  static async getPlanes(params?: Record<string, unknown>): Promise<PlanResponse[]> {
    const response = await leadsHttp.get<PlanResponse[]>('/planes', { params });
    return parseApiResponse(planResponseArraySchema, response.data, 'GET /planes');
  }

  static async createPlan(payload: PlanRequest): Promise<PlanResponse> {
    const response = await leadsHttp.post<PlanResponse>('/planes', payload);
    return parseApiResponse(planResponseSchema, response.data, 'POST /planes');
  }

  static async updatePlan(id: number, payload: PlanUpdateRequest): Promise<PlanResponse> {
    const response = await leadsHttp.put<PlanResponse>(`/planes/${id}`, payload);
    return parseApiResponse(planResponseSchema, response.data, 'PUT /planes/{id}');
  }

  static async deletePlan(id: number): Promise<PlanResponse> {
    const response = await leadsHttp.delete<PlanResponse>(`/planes/${id}`);
    return parseApiResponse(planResponseSchema, response.data, 'DELETE /planes/{id}');
  }

  // ========================================================================
  // SERVICIOS DE PLAN
  // ========================================================================

  static async getServiciosProveedor(idProveedor: number): Promise<ServiciosProveedorResponse> {
    const response = await leadsHttp.get<ServiciosProveedorResponse>(
      `/planes/servicios?idProveedor=${idProveedor}`,
    );
    return parseApiResponse(
      serviciosProveedorResponseSchema,
      response.data,
      'GET /planes/servicios',
    );
  }

  // ========================================================================
  // ADICIONALES
  // ========================================================================

  static async getAdicionales(idProveedor?: number): Promise<AdicionalResponse[]> {
    const response = await leadsHttp.get<AdicionalResponse[]>('/planes/adicionales', {
      params: idProveedor ? { idProveedor } : undefined,
    });
    return parseApiResponse(adicionalResponseArraySchema, response.data, 'GET /planes/adicionales');
  }

  static async createAdicional(payload: AdicionalRequest): Promise<AdicionalResponse> {
    const response = await leadsHttp.post<AdicionalResponse>('/planes/adicionales', payload);
    return parseApiResponse(adicionalResponseSchema, response.data, 'POST /planes/adicionales');
  }

  // ========================================================================
  // PROMOCIONES
  // ========================================================================

  static async getPromociones(
    filtros?: {
      proveedorId?: number | null;
      zonaId?: number | null;
      interno?: boolean | null;
    },
  ): Promise<PromocionComercialResponse[]> {
    const params: Record<string, unknown> = {};

    if (typeof filtros?.proveedorId === 'number' && filtros.proveedorId > 0) {
      params.proveedorId = filtros.proveedorId;
    }
    if (typeof filtros?.zonaId === 'number' && filtros.zonaId > 0) {
      params.zonaId = filtros.zonaId;
    }
    if (typeof filtros?.interno === 'boolean') {
      params.interno = filtros.interno;
    }

    console.debug('[LeadsRepository] GET /promociones params:', Object.keys(params).length > 0 ? params : 'none');

    const response = await leadsHttp.get<PromocionComercialResponse[]>('/promociones', {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return parseApiResponse(
      promocionComercialResponseArraySchema,
      response.data,
      'GET /promociones',
    );
  }

  static async createPromocion(
    payload: PromocionComercialRequest,
  ): Promise<PromocionComercialResponse> {
    const response = await leadsHttp.post<PromocionComercialResponse>('/promociones', payload);
    return parseApiResponse(
      promocionComercialResponseSchema,
      response.data,
      'POST /promociones',
    );
  }

  static async deletePromocion(id: number): Promise<PromocionComercialResponse> {
    const response = await leadsHttp.delete<PromocionComercialResponse>(`/promociones/${id}`);
    return parseApiResponse(
      promocionComercialResponseSchema,
      response.data,
      'DELETE /promociones/{id}',
    );
  }

  // ========================================================================
  // PROVEEDORES
  // ========================================================================

  static async getProveedores(): Promise<ProveedorResponse[]> {
    const response = await leadsHttp.get<ProveedorResponse[]>('/proveedores');
    return parseApiResponse(proveedorResponseArraySchema, response.data, 'GET /proveedores');
  }

  static async createProveedor(payload: ProveedorRequest): Promise<ProveedorResponse> {
    const response = await leadsHttp.post<ProveedorResponse>('/proveedores', payload);
    return parseApiResponse(proveedorResponseSchema, response.data, 'POST /proveedores');
  }

  static async updateProveedorEstado(id: number): Promise<ProveedorResponse> {
    const response = await leadsHttp.patch<ProveedorResponse>(`/proveedores/${id}/estado`);
    return parseApiResponse(
      proveedorResponseSchema,
      response.data,
      'PATCH /proveedores/{id}/estado',
    );
  }

  // ========================================================================
  // ZONAS
  // ========================================================================

  static async getZonas(activo?: boolean): Promise<ZonaResponse[]> {
    const response = await leadsHttp.get<ZonaResponse[]>('/zonas', {
      params: activo !== undefined ? { activo } : undefined,
    });
    return parseApiResponse(zonaResponseArraySchema, response.data, 'GET /zonas');
  }

  static async createZona(payload: ZonaRequest): Promise<ZonaResponse> {
    const response = await leadsHttp.post<ZonaResponse>('/zonas', payload);
    return parseApiResponse(zonaResponseSchema, response.data, 'POST /zonas');
  }

  static async updateZona(id: number, payload: ZonaRequest): Promise<ZonaResponse> {
    const response = await leadsHttp.put<ZonaResponse>(`/zonas/${id}`, payload);
    return parseApiResponse(zonaResponseSchema, response.data, 'PUT /zonas/{id}');
  }

  static async updateZonaEstado(id: number): Promise<ZonaResponse> {
    const response = await leadsHttp.patch<ZonaResponse>(`/zonas/${id}/estado`);
    return parseApiResponse(zonaResponseSchema, response.data, 'PATCH /zonas/{id}/estado');
  }

  // ========================================================================
  // TIPIFICACIONES
  // ========================================================================

  static async getCatalogoTipificacion(etapa: string): Promise<CatalogoResponse> {
    const response = await leadsHttp.get<CatalogoResponse>(
      `/tipificaciones/${etapa}/catalogo`,
    );
    return parseApiResponse(
      catalogoResponseSchema,
      response.data,
      'GET /tipificaciones/{etapa}/catalogo',
    );
  }

  static async updateCatalogoTipificacion(payload: CatalogoRequest): Promise<CatalogoResponse> {
    const response = await leadsHttp.put<CatalogoResponse>('/tipificaciones/catalogo', payload);
    return parseApiResponse(
      catalogoResponseSchema,
      response.data,
      'PUT /tipificaciones/catalogo',
    );
  }

  static async updateCatalogoEstado(payload: CatalogoEstadoRequest): Promise<CatalogoResponse> {
    const response = await leadsHttp.patch<CatalogoResponse>(
      '/tipificaciones/catalogo/estado',
      payload,
    );
    return parseApiResponse(
      catalogoResponseSchema,
      response.data,
      'PATCH /tipificaciones/catalogo/estado',
    );
  }

  // ========================================================================
  // UBIGEO
  // ========================================================================

  static async getDepartamentos(): Promise<DepartamentoResponse[]> {
    const response = await leadsHttp.get<DepartamentoResponse[]>('/ubigeo/departamentos');
    return parseApiResponse(
      departamentoResponseArraySchema,
      response.data,
      'GET /ubigeo/departamentos',
    );
  }

  static async getProvinciasPorDepartamento(
    idDepartamento: number,
  ): Promise<ProvinciaResponse[]> {
    const response = await leadsHttp.get<ProvinciaResponse[]>(
      `/ubigeo/departamentos/${idDepartamento}/provincias`,
    );
    return parseApiResponse(
      provinciaResponseArraySchema,
      response.data,
      'GET /ubigeo/departamentos/{idDepartamento}/provincias',
    );
  }

  static async getDistritosPorProvincia(idProvincia: number): Promise<DistritoResponse[]> {
    const response = await leadsHttp.get<DistritoResponse[]>(
      `/ubigeo/provincias/${idProvincia}/distritos`,
    );
    return parseApiResponse(
      distritoResponseArraySchema,
      response.data,
      'GET /ubigeo/provincias/{idProvincia}/distritos',
    );
  }
}
