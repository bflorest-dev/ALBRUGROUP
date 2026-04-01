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
  TipificacionResponse,
  SubtipificacionResponse,
  CatalogoResponse,
  CatalogoRequest,
  CatalogoEstadoRequest,
} from '@shared/types';

/**
 * Repositorio para Lead Service
 * Consumidor de endpoints: /leads/*
 */
export class LeadsRepository {
  // ========================================================================
  // CAMPAÑAS
  // ========================================================================

  static async getCampanas(activo?: boolean): Promise<CampanaResponse[]> {
    const response = await leadsHttp.get<CampanaResponse[]>('/campanas', {
      params: activo !== undefined ? { activo } : undefined,
    });
    return response.data;
  }

  static async createCampana(payload: CampanaRequest): Promise<CampanaResponse> {
    const response = await leadsHttp.post<CampanaResponse>('/campanas', payload);
    return response.data;
  }

  static async updateCampana(
    id: number,
    payload: Partial<CampanaRequest>,
  ): Promise<CampanaResponse> {
    const response = await leadsHttp.put<CampanaResponse>(`/campanas/${id}`, payload);
    return response.data;
  }

  static async deleteCampana(id: number): Promise<CampanaResponse> {
    const response = await leadsHttp.delete<CampanaResponse>(`/campanas/${id}`);
    return response.data;
  }

  // ========================================================================
  // CUENTAS PUBLICITARIAS
  // ========================================================================

  static async getCuentasPublicitarias(activo?: boolean): Promise<CuentaPublicitariaResponse[]> {
    const response = await leadsHttp.get<CuentaPublicitariaResponse[]>('/cuentas-publicitarias', {
      params: activo !== undefined ? { activo } : undefined,
    });
    return response.data;
  }

  static async getCuentasPublicitariasActivas(): Promise<CuentaPublicitariaResponse[]> {
    const response = await leadsHttp.get<CuentaPublicitariaResponse[]>(
      '/cuentas-publicitarias/activas',
    );
    return response.data;
  }

  static async createCuentaPublicitaria(
    payload: CuentaPublicitariaRequest,
  ): Promise<CuentaPublicitariaResponse> {
    const response = await leadsHttp.post<CuentaPublicitariaResponse>(
      '/cuentas-publicitarias',
      payload,
    );
    return response.data;
  }

  static async deleteCuentaPublicitaria(
    id: number,
  ): Promise<CuentaPublicitariaResponse> {
    const response = await leadsHttp.delete<CuentaPublicitariaResponse>(
      `/cuentas-publicitarias/${id}`,
    );
    return response.data;
  }

  // ========================================================================
  // LEADS - Operaciones Principales
  // ========================================================================

  /**
   * Registra un nuevo lead (Intake)
   * POST /leads/leads/intake
   */
  static async intakeLead(payload: LeadIntakeRequest): Promise<void> {
    await leadsHttp.post('/leads/intake', payload);
  }

  /**
   * Asigna un lead a un asesor
   * PATCH /leads/leads/{idLead}/asignacion
   */
  static async asignarLead(
    idLead: number,
    payload: LeadAsignacionRequest,
  ): Promise<void> {
    await leadsHttp.patch(`/leads/${idLead}/asignacion`, payload);
  }

  /**
   * Obtiene bandeja de leads del asesor de ventas actual
   * GET /leads/leads/asesor-ventas
   */
  static async getBandejaAsesorVentas(): Promise<LeadAsesorVentasResponse[]> {
    const response = await leadsHttp.get<unknown>('/leads/asesor-ventas');
    const data = response.data;

    // Support both contract shapes: array or object { leads: [...] }
    if (Array.isArray(data)) {
      return data as LeadAsesorVentasResponse[];
    }

    if (data && typeof data === 'object' && 'leads' in (data as Record<string, unknown>)) {
      const leads = (data as Record<string, unknown>)['leads'];
      if (Array.isArray(leads)) {
        return leads as LeadAsesorVentasResponse[];
      }
    }

    console.warn('[LeadsRepository] Formato inesperado en /leads/asesor-ventas', data);
    return [];
  }

  /**
   * Obtiene detalle del lead para asesor de ventas
   * GET /leads/leads/{idLead}/detalle-asesor
   */
  static async getDetalleAsesor(idLead: number): Promise<LeadAsesorDetalleResponse> {
    const response = await leadsHttp.get<LeadAsesorDetalleResponse>(
      `/leads/${idLead}/detalle-asesor`,
    );
    return response.data;
  }

  /**
   * Actualiza datos de preventa del lead
   * PATCH /leads/leads/{idLead}/datos-preventa
   */
  static async updateDatosPreventa(
    idLead: number,
    payload: LeadDatosPreventaRequest,
  ): Promise<void> {
    await leadsHttp.patch(`/leads/${idLead}/datos-preventa`, payload);
  }

  /**
   * Actualiza dirección del lead
   * PATCH /leads/leads/{idLead}/direccion
   */
  static async updateDireccion(
    idLead: number,
    payload: LeadDireccionRequest,
  ): Promise<void> {
    await leadsHttp.patch(`/leads/${idLead}/direccion`, payload);
  }

  /**
   * Actualiza oferta comercial del lead
   * PATCH /leads/leads/{idLead}/oferta-comercial
   */
  static async updateOfertaComercial(
    idLead: number,
    payload: LeadOfertaComercialRequest,
  ): Promise<void> {
    await leadsHttp.patch(`/leads/${idLead}/oferta-comercial`, payload);
  }

  /**
   * Tipifica el lead (cierre de venta)
   * POST /leads/leads/{idLead}/tipificacion
   */
  static async tipificarLead(
    idLead: number,
    payload: LeadTipificacionRequest,
  ): Promise<void> {
    await leadsHttp.post(`/leads/${idLead}/tipificacion`, payload);
  }

  /**
   * Registra contacto/interacción con el lead
   * POST /leads/leads/{idLead}/contacto
   */
  static async registrarContacto(idLead: number, payload?: LeadContactoRequest): Promise<void> {
    await leadsHttp.post(`/leads/${idLead}/contacto`, payload);
  }

  /**
   * Obtiene bandeja de leads para GTR
   * GET /leads/leads/gtr
   */
  static async getBandejaGtr(params?: Record<string, unknown>): Promise<LeadGtrResponse[]> {
    const response = await leadsHttp.get<LeadGtrResponse[]>('/leads/gtr', { params });
    return response.data;
  }

  // ========================================================================
  // EVENTOS DE LEAD
  // ========================================================================

  static async getEventosPorLead(idLead: number): Promise<EventoResponse[]> {
    const response = await leadsHttp.get<EventoResponse[]>(`/eventos/lead/${idLead}`);
    return response.data;
  }

  static async getEventosPorEmpleado(
    idEmpleado: number,
    params?: Record<string, unknown>,
  ): Promise<EventoResponse[]> {
    const response = await leadsHttp.get<EventoResponse[]>(`/eventos/empleado/${idEmpleado}`, {
      params,
    });
    return response.data;
  }

  // ========================================================================
  // PLANES
  // ========================================================================

  static async getPlanes(params?: Record<string, unknown>): Promise<PlanResponse[]> {
    const response = await leadsHttp.get<PlanResponse[]>('/planes', { params });
    return response.data;
  }

  static async createPlan(payload: PlanRequest): Promise<PlanResponse> {
    const response = await leadsHttp.post<PlanResponse>('/planes', payload);
    return response.data;
  }

  static async updatePlan(id: number, payload: PlanUpdateRequest): Promise<PlanResponse> {
    const response = await leadsHttp.put<PlanResponse>(`/planes/${id}`, payload);
    return response.data;
  }

  static async deletePlan(id: number): Promise<PlanResponse> {
    const response = await leadsHttp.delete<PlanResponse>(`/planes/${id}`);
    return response.data;
  }

  // ========================================================================
  // SERVICIOS DE PLAN
  // ========================================================================

  static async getServiciosProveedor(idProveedor: number): Promise<ServiciosProveedorResponse> {
    const response = await leadsHttp.get<ServiciosProveedorResponse>(
      `/planes/servicios?idProveedor=${idProveedor}`,
    );
    return response.data;
  }

  // ========================================================================
  // ADICIONALES
  // ========================================================================

  static async getAdicionales(idProveedor?: number): Promise<AdicionalResponse[]> {
    const response = await leadsHttp.get<AdicionalResponse[]>('/planes/adicionales', {
      params: idProveedor ? { idProveedor } : undefined,
    });
    return response.data;
  }

  static async createAdicional(payload: AdicionalRequest): Promise<AdicionalResponse> {
    const response = await leadsHttp.post<AdicionalResponse>('/planes/adicionales', payload);
    return response.data;
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
    return response.data;
  }

  static async createPromocion(
    payload: PromocionComercialRequest,
  ): Promise<PromocionComercialResponse> {
    const response = await leadsHttp.post<PromocionComercialResponse>('/promociones', payload);
    return response.data;
  }

  static async deletePromocion(id: number): Promise<PromocionComercialResponse> {
    const response = await leadsHttp.delete<PromocionComercialResponse>(`/promociones/${id}`);
    return response.data;
  }

  // ========================================================================
  // PROVEEDORES
  // ========================================================================

  static async getProveedores(): Promise<ProveedorResponse[]> {
    const response = await leadsHttp.get<ProveedorResponse[]>('/proveedores');
    return response.data;
  }

  static async createProveedor(payload: ProveedorRequest): Promise<ProveedorResponse> {
    const response = await leadsHttp.post<ProveedorResponse>('/proveedores', payload);
    return response.data;
  }

  static async updateProveedorEstado(id: number): Promise<ProveedorResponse> {
    const response = await leadsHttp.patch<ProveedorResponse>(`/proveedores/${id}/estado`);
    return response.data;
  }

  // ========================================================================
  // ZONAS
  // ========================================================================

  static async getZonas(activo?: boolean): Promise<ZonaResponse[]> {
    const response = await leadsHttp.get<ZonaResponse[]>('/zonas', {
      params: activo !== undefined ? { activo } : undefined,
    });
    return response.data;
  }

  static async createZona(payload: ZonaRequest): Promise<ZonaResponse> {
    const response = await leadsHttp.post<ZonaResponse>('/zonas', payload);
    return response.data;
  }

  static async updateZona(id: number, payload: ZonaRequest): Promise<ZonaResponse> {
    const response = await leadsHttp.put<ZonaResponse>(`/zonas/${id}`, payload);
    return response.data;
  }

  static async updateZonaEstado(id: number): Promise<ZonaResponse> {
    const response = await leadsHttp.patch<ZonaResponse>(`/zonas/${id}/estado`);
    return response.data;
  }

  // ========================================================================
  // TIPIFICACIONES
  // ========================================================================

  static async getCatalogoTipificacion(etapa: string): Promise<CatalogoResponse> {
    const response = await leadsHttp.get<CatalogoResponse>(
      `/tipificaciones/${etapa}/catalogo`,
    );
    return response.data;
  }

  static async updateCatalogoTipificacion(payload: CatalogoRequest): Promise<CatalogoResponse> {
    const response = await leadsHttp.put<CatalogoResponse>('/tipificaciones/catalogo', payload);
    return response.data;
  }

  static async updateCatalogoEstado(payload: CatalogoEstadoRequest): Promise<CatalogoResponse> {
    const response = await leadsHttp.patch<CatalogoResponse>(
      '/tipificaciones/catalogo/estado',
      payload,
    );
    return response.data;
  }

  // ========================================================================
  // UBIGEO
  // ========================================================================

  static async getDepartamentos(): Promise<DepartamentoResponse[]> {
    const response = await leadsHttp.get<DepartamentoResponse[]>('/ubigeo/departamentos');
    return response.data;
  }

  static async getProvinciasPorDepartamento(
    idDepartamento: number,
  ): Promise<ProvinciaResponse[]> {
    const response = await leadsHttp.get<ProvinciaResponse[]>(
      `/ubigeo/departamentos/${idDepartamento}/provincias`,
    );
    return response.data;
  }

  static async getDistritosPorProvincia(idProvincia: number): Promise<DistritoResponse[]> {
    const response = await leadsHttp.get<DistritoResponse[]>(
      `/ubigeo/provincias/${idProvincia}/distritos`,
    );
    return response.data;
  }
}