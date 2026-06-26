import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { UsuarioResponse } from '../../../shared/models/auth/usuario-response';
import {
  AdicionalResponse,
  AgendadosGtrResumenResponse,
  CampanaResponse,
  CatalogoResponse,
  LeadAsignacionMasivaRequest,
  LeadAsignacionMasivaResponse,
  LeadAsignacionRequest,
  LeadAgendadoGtrResponse,
  LeadAsesorVentasResponse,
  LeadDatosPreventaRequest,
  LeadDetalleResponse,
  LeadDireccionRequest,
  EventoResponse,
  LeadGtrResponse,
  LeadGtrGroupFilter,
  LeadGtrGroupsResponse,
  LeadGtrLookupResponse,
  LeadGtrMetricasResponse,
  AsesorLeadsPendientesResponse,
  AsesorSinLeadsResponse,
  SupervisorVentasReporteQuery,
  SupervisorVentasReporteResponse,
  SupervisorVentasResumenResponse,
  GtrRankingAsesorResponse,
  GtrTipificacionCampanaResponse,
  GtrTipificacionRankingResponse,
  GtrSubtipificacionRankingResponse,
  LeadIntakeRequest,
  LeadIntakeRetroactivoRequest,
  LeadIntakeMasivoExcelResponse,
  MasivoLeadFilters,
  MisPreventaResponse,
  OportunidadHermana,
  LeadSnapshotsRequest,
  LeadOfertaComercialRequest,
  LeadPage,
  LeadTipificacionRequest,
  PageQuery,
  PlanResponse,
  PromocionComercialResponse,
  UbigeoItem,
  ZonaResponse
} from '../../../shared/models/preventa/preventa.models';

@Injectable({ providedIn: 'root' })
export class PreventaLeadService {
  private readonly http = inject(HttpClient);
  private readonly leadUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads`;
  private readonly authUrl = `${API_CONSTANTS.gatewayBaseUrl}${API_CONSTANTS.authBasePath}`;

  // Multi-titular: crea otra oportunidad para el mismo contacto (devuelve el id de la nueva).
  crearOportunidadAdicional(idLead: number): Observable<number> {
    return this.http.post<number>(`${this.leadUrl}/preventa/${idLead}/oportunidad-adicional`, {});
  }

  // Multi-titular: oportunidades del contacto (para el selector del asesor y la lupa del GTR).
  listarOportunidadesContacto(idLead: number): Observable<OportunidadHermana[]> {
    return this.http.get<OportunidadHermana[]>(`${this.leadUrl}/preventa/${idLead}/oportunidades-contacto`);
  }

  // Multi-titular: descartar (eliminar) una oportunidad creada por error, solo si está vacía.
  descartarOportunidad(idLead: number): Observable<void> {
    return this.http.delete<void>(`${this.leadUrl}/preventa/${idLead}/oportunidad`);
  }

  // Atención GTR: cerrar la atención de un lead en otra etapa sin tipificarlo (libera al asesor).
  cerrarAtencion(idLead: number): Observable<void> {
    return this.http.patch<void>(`${this.leadUrl}/preventa/${idLead}/atencion/cerrar`, {});
  }

  listarBandejaGtr(
    fecha: string,
    query: PageQuery,
    filters: LeadGtrGroupFilter = {}
  ): Observable<LeadPage<LeadGtrResponse>> {
    let params = this.pageParams(query).set('fecha', fecha);
    if (filters.tipoGrupo) {
      params = params.set('tipoGrupo', filters.tipoGrupo);
    }
    if (filters.idGrupo !== undefined) {
      params = params.set('idGrupo', filters.idGrupo);
    }
    if (filters.estado) {
      params = params.set('estado', filters.estado);
    }
    if (filters.codigoTipificacion) {
      params = params.set('codigoTipificacion', filters.codigoTipificacion);
    }
    if (filters.codigoSubtipificacion) {
      params = params.set('codigoSubtipificacion', filters.codigoSubtipificacion);
    }
    if (filters.sinValor) {
      params = params.set('sinValor', true);
    }
    return this.http.get<LeadPage<LeadGtrResponse>>(`${this.leadUrl}/preventa/gtr`, {
      params
    });
  }

  listarAgrupacionesBandejaGtr(fecha: string): Observable<LeadGtrGroupsResponse> {
    return this.http.get<LeadGtrGroupsResponse>(`${this.leadUrl}/preventa/gtr/agrupaciones`, {
      params: new HttpParams().set('fecha', fecha)
    });
  }

  listarLeadsPendientesPorAsesor(): Observable<AsesorLeadsPendientesResponse[]> {
    return this.http.get<AsesorLeadsPendientesResponse[]>(`${this.leadUrl}/preventa/gtr/leads-pendientes-asesor`);
  }

  obtenerResumenSupervisor(): Observable<SupervisorVentasResumenResponse[]> {
    return this.http.get<SupervisorVentasResumenResponse[]>(`${this.leadUrl}/preventa/supervisor-ventas/resumen`);
  }

  obtenerReporteVentasSupervisor(query: SupervisorVentasReporteQuery): Observable<SupervisorVentasReporteResponse> {
    const params = new HttpParams()
      .set('fechaDesde', query.fechaDesde)
      .set('fechaHasta', query.fechaHasta);
    return this.http.get<SupervisorVentasReporteResponse>(`${this.leadUrl}/preventa/supervisor-ventas/reporte-ventas`, {
      params
    });
  }

  listarSinLeadsDesde(idsAsesor: number[]): Observable<AsesorSinLeadsResponse[]> {
    const params = new HttpParams().set('idsAsesor', idsAsesor.join(','));
    return this.http.get<AsesorSinLeadsResponse[]>(`${this.leadUrl}/preventa/supervisor-ventas/sin-leads-desde`, {
      params
    });
  }

  buscarLeadGtr(lead: string, query: PageQuery): Observable<LeadPage<LeadGtrResponse>> {
    return this.http.get<LeadPage<LeadGtrResponse>>(`${this.leadUrl}/preventa/gtr`, {
      params: this.pageParams(query).set('lead', lead)
    });
  }

  buscarContextoLeadGtr(lead: string): Observable<LeadGtrLookupResponse> {
    return this.http.get<LeadGtrLookupResponse>(`${this.leadUrl}/preventa/gtr/lookup`, {
      params: new HttpParams().set('lead', lead)
    });
  }

  eliminarLeadIntegral(idLead: number): Observable<void> {
    return this.http.delete<void>(`${this.leadUrl}/preventa/${idLead}`);
  }

  listarRankingGtr(
    desde: string,
    hasta?: string,
    soloActivos = true,
    idEquipo?: number | null
  ): Observable<GtrRankingAsesorResponse[]> {
    let params = new HttpParams().set('desde', desde).set('soloActivos', soloActivos);
    if (hasta) params = params.set('hasta', hasta);
    if (idEquipo !== null && idEquipo !== undefined) params = params.set('idEquipo', idEquipo);
    return this.http.get<GtrRankingAsesorResponse[]>(`${this.leadUrl}/preventa/gtr/ranking`, { params });
  }

  listarTipificacionesCampanaGtr(desde: string, hasta?: string, soloActivos = true): Observable<GtrTipificacionCampanaResponse[]> {
    let params = new HttpParams().set('desde', desde).set('soloActivos', soloActivos);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<GtrTipificacionCampanaResponse[]>(`${this.leadUrl}/preventa/gtr/tipificaciones-campana`, { params });
  }

  listarTipificacionesRankingGtr(
    desde: string,
    hasta?: string,
    soloActivos = true,
    idEquipo?: number | null
  ): Observable<GtrTipificacionRankingResponse[]> {
    let params = new HttpParams().set('desde', desde).set('soloActivos', soloActivos);
    if (hasta) params = params.set('hasta', hasta);
    if (idEquipo !== null && idEquipo !== undefined) params = params.set('idEquipo', idEquipo);
    return this.http.get<GtrTipificacionRankingResponse[]>(`${this.leadUrl}/preventa/gtr/tipificaciones`, { params });
  }

  listarSubtipificacionesRankingGtr(
    codigoTipificacion: string,
    desde: string,
    hasta?: string,
    soloActivos = true,
    idEquipo?: number | null
  ): Observable<GtrSubtipificacionRankingResponse[]> {
    let params = new HttpParams().set('desde', desde).set('soloActivos', soloActivos);
    if (hasta) params = params.set('hasta', hasta);
    if (idEquipo !== null && idEquipo !== undefined) params = params.set('idEquipo', idEquipo);
    return this.http.get<GtrSubtipificacionRankingResponse[]>(
      `${this.leadUrl}/preventa/gtr/tipificaciones/${encodeURIComponent(codigoTipificacion)}/subtipificaciones`,
      { params }
    );
  }

  obtenerMetricasGtr(fecha: string): Observable<LeadGtrMetricasResponse> {
    return this.http.get<LeadGtrMetricasResponse>(`${this.leadUrl}/preventa/gtr/metricas`, {
      params: new HttpParams().set('fecha', fecha)
    });
  }

  listarAgendadosGtr(query: PageQuery): Observable<LeadPage<LeadAgendadoGtrResponse>> {
    return this.http.get<LeadPage<LeadAgendadoGtrResponse>>(`${this.leadUrl}/preventa/gtr/agendados`, {
      params: this.pageParams(query)
    });
  }

  obtenerResumenAgendadosGtr(): Observable<AgendadosGtrResumenResponse> {
    return this.http.get<AgendadosGtrResumenResponse>(`${this.leadUrl}/preventa/gtr/agendados/resumen`);
  }

  listarEventosLead(idLead: number, fecha: string, query: PageQuery): Observable<LeadPage<EventoResponse>> {
    return this.http.get<LeadPage<EventoResponse>>(`${this.leadUrl}/eventos/lead/${idLead}`, {
      params: this.pageParams(query).set('fechaDesde', fecha).set('fechaHasta', fecha)
    });
  }

  listarEventosEmpleado(idEmpleado: number, fecha: string, query: PageQuery): Observable<LeadPage<EventoResponse>> {
    return this.http.get<LeadPage<EventoResponse>>(`${this.leadUrl}/eventos/empleado/${idEmpleado}`, {
      params: this.pageParams(query).set('fechaDesde', fecha).set('fechaHasta', fecha)
    });
  }

  listarEventosLeadFiltrados(
    idLead: number,
    query: PageQuery,
    filters: { accion?: string; fechaDesde?: string; fechaHasta?: string } = {}
  ): Observable<LeadPage<EventoResponse>> {
    let params = this.pageParams(query);
    if (filters.accion) {
      params = params.set('accion', filters.accion);
    }
    if (filters.fechaDesde) {
      params = params.set('fechaDesde', filters.fechaDesde);
    }
    if (filters.fechaHasta) {
      params = params.set('fechaHasta', filters.fechaHasta);
    }
    return this.http.get<LeadPage<EventoResponse>>(`${this.leadUrl}/eventos/lead/${idLead}`, { params });
  }

  listarLeadsMasivo(filters: MasivoLeadFilters, query: PageQuery): Observable<LeadPage<LeadGtrResponse>> {
    return this.http.get<LeadPage<LeadGtrResponse>>(`${this.leadUrl}/masivo/leads`, {
      params: this.masivoParams(filters, query)
    });
  }

  listarAgrupacionesLeadsMasivo(filters: MasivoLeadFilters): Observable<LeadGtrGroupsResponse> {
    return this.http.get<LeadGtrGroupsResponse>(`${this.leadUrl}/masivo/leads/agrupaciones`, {
      params: this.masivoFilterParams(filters)
    });
  }

  registrarIngresoLead(request: LeadIntakeRequest): Observable<void> {
    return this.http.post<void>(`${this.leadUrl}/preventa/intake`, request);
  }

  registrarIngresoLeadRetroactivo(request: LeadIntakeRetroactivoRequest): Observable<void> {
    return this.http.post<void>(`${this.leadUrl}/preventa/intake/retroactivo`, request);
  }

  registrarIngresoLeadsExcel(file: File): Observable<LeadIntakeMasivoExcelResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<LeadIntakeMasivoExcelResponse>(
      `${this.leadUrl}/preventa/intake-masivo/excel`,
      formData
    );
  }

  actualizarSnapshotsLead(idLead: number, request: LeadSnapshotsRequest): Observable<void> {
    return this.http.patch<void>(`${this.leadUrl}/preventa/${idLead}/snapshots`, request);
  }

  asignarLead(idLead: number, request: LeadAsignacionRequest): Observable<void> {
    return this.http.patch<void>(`${this.leadUrl}/preventa/${idLead}/asignacion`, request);
  }

  asignarLeads(request: LeadAsignacionMasivaRequest): Observable<LeadAsignacionMasivaResponse> {
    return this.http.patch<LeadAsignacionMasivaResponse>(`${this.leadUrl}/preventa/asignacion-masiva`, request);
  }

  listarBandejaAsesorVentas(query: PageQuery): Observable<LeadPage<LeadAsesorVentasResponse>> {
    return this.http.get<LeadPage<LeadAsesorVentasResponse>>(`${this.leadUrl}/preventa/asesor-ventas`, {
      params: this.pageParams(query)
    });
  }

  obtenerDetalleAsesor(idLead: number): Observable<LeadDetalleResponse> {
    return this.http.get<LeadDetalleResponse>(`${this.leadUrl}/preventa/${idLead}/detalle-asesor`);
  }

  listarMisPreventas(query: PageQuery, fechaDesde?: string, fechaHasta?: string): Observable<LeadPage<MisPreventaResponse>> {
    let params = this.pageParams(query);
    if (fechaDesde) {
      params = params.set('fechaDesde', fechaDesde);
    }
    if (fechaHasta) {
      params = params.set('fechaHasta', fechaHasta);
    }
    return this.http.get<LeadPage<MisPreventaResponse>>(`${this.leadUrl}/preventa/asesor-ventas/mis-preventas`, {
      params
    });
  }

  obtenerDetalleMiPreventa(idLead: number): Observable<LeadDetalleResponse> {
    return this.http.get<LeadDetalleResponse>(`${this.leadUrl}/preventa/${idLead}/detalle-mi-preventa`);
  }

  iniciarGestionLead(idLead: number): Observable<void> {
    return this.http.patch<void>(`${this.leadUrl}/preventa/${idLead}/gestion`, {});
  }

  registrarContacto(idLead: number): Observable<void> {
    return this.http.post<void>(`${this.leadUrl}/preventa/${idLead}/contacto`, {});
  }

  actualizarDatosPreventa(idLead: number, request: LeadDatosPreventaRequest): Observable<void> {
    return this.http.patch<void>(`${this.leadUrl}/preventa/${idLead}/datos-preventa`, request);
  }

  actualizarDireccion(idLead: number, request: LeadDireccionRequest): Observable<void> {
    return this.http.patch<void>(`${this.leadUrl}/preventa/${idLead}/direccion`, request);
  }

  actualizarOfertaComercial(idLead: number, request: LeadOfertaComercialRequest): Observable<void> {
    return this.http.patch<void>(`${this.leadUrl}/preventa/${idLead}/oferta-comercial`, request);
  }

  tipificarLead(idLead: number, request: LeadTipificacionRequest): Observable<void> {
    return this.http.post<void>(`${this.leadUrl}/preventa/${idLead}/tipificacion`, request);
  }

  getCatalogoTipificaciones(etapa: string): Observable<CatalogoResponse> {
    return this.http.get<CatalogoResponse>(`${this.leadUrl}/tipificaciones/${etapa}/catalogo`);
  }

  listarCampanasActivas(): Observable<CampanaResponse[]> {
    return this.http.get<CampanaResponse[]>(`${this.leadUrl}/campanas`, {
      params: new HttpParams().set('activo', true)
    });
  }

  listarPlanes(idProveedor?: number, soloVigentes = true): Observable<PlanResponse[]> {
    let params = new HttpParams().set('soloVigentes', soloVigentes);
    if (idProveedor) {
      params = params.set('idProveedor', idProveedor);
    }
    return this.http.get<PlanResponse[]>(`${this.leadUrl}/planes`, { params });
  }

  listarPromociones(filters: { idProveedor?: number; idZona?: number; idPlan?: number }): Observable<PromocionComercialResponse[]> {
    let params = new HttpParams();
    if (filters.idProveedor) {
      params = params.set('idProveedor', filters.idProveedor);
    }
    if (filters.idZona) {
      params = params.set('idZona', filters.idZona);
    }
    if (filters.idPlan) {
      params = params.set('idPlan', filters.idPlan);
    }
    return this.http.get<PromocionComercialResponse[]>(`${this.leadUrl}/promociones`, { params });
  }

  listarAdicionales(idProveedor: number): Observable<AdicionalResponse[]> {
    return this.http.get<AdicionalResponse[]>(`${this.leadUrl}/planes/adicionales`, {
      params: new HttpParams().set('idProveedor', idProveedor)
    });
  }

  listarZonasActivas(): Observable<ZonaResponse[]> {
    return this.http.get<ZonaResponse[]>(`${this.leadUrl}/zonas`, {
      params: new HttpParams().set('activo', true)
    });
  }

  listarDepartamentos(): Observable<UbigeoItem[]> {
    return this.http.get<UbigeoItem[]>(`${this.leadUrl}/ubigeo/departamentos`);
  }

  listarProvincias(idDepartamento: number): Observable<UbigeoItem[]> {
    return this.http.get<UbigeoItem[]>(`${this.leadUrl}/ubigeo/departamentos/${idDepartamento}/provincias`);
  }

  listarDistritos(idProvincia: number): Observable<UbigeoItem[]> {
    return this.http.get<UbigeoItem[]>(`${this.leadUrl}/ubigeo/provincias/${idProvincia}/distritos`);
  }

  listarUsuariosActivosPorRol(puestoTrabajo: string): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(`${this.authUrl}/roles/${puestoTrabajo}/usuarios`);
  }

  private pageParams(query: PageQuery): HttpParams {
    return new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize)
      .set('sortBy', query.sortBy)
      .set('direction', query.direction);
  }

  private masivoParams(filters: MasivoLeadFilters, query: PageQuery): HttpParams {
    let params = this.masivoFilterParams(filters);
    params = params
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize)
      .set('sortBy', query.sortBy)
      .set('direction', query.direction);
    if (filters.tipoGrupo) {
      params = params.set('tipoGrupo', filters.tipoGrupo);
    }
    if (filters.estado) {
      params = params.set('estado', filters.estado);
    }
    if (filters.codigoTipificacion) {
      params = params.set('codigoTipificacion', filters.codigoTipificacion);
    }
    if (filters.codigoSubtipificacion) {
      params = params.set('codigoSubtipificacion', filters.codigoSubtipificacion);
    }
    if (filters.fechaIngreso) {
      params = params.set('fechaIngreso', filters.fechaIngreso);
    }
    if (filters.sinValor) {
      params = params.set('sinValor', true);
    }
    return params;
  }

  private masivoFilterParams(filters: MasivoLeadFilters): HttpParams {
    let params = new HttpParams();
    if (filters.idProveedor) {
      params = params.set('idProveedor', filters.idProveedor);
    }
    if (filters.etapa) {
      params = params.set('etapa', filters.etapa);
    }
    for (const id of filters.tipificaciones ?? []) {
      params = params.append('tipificaciones', id);
    }
    for (const id of filters.subtipificaciones ?? []) {
      params = params.append('subtipificaciones', id);
    }
    if (filters.fechaDesde) {
      params = params.set('fechaDesde', filters.fechaDesde);
    }
    if (filters.fechaHasta) {
      params = params.set('fechaHasta', filters.fechaHasta);
    }
    return params;
  }
}
