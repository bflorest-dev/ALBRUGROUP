import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import {
  AdicionalResponse,
  CatalogoResponse,
  EventoResponse,
  LeadContextoLookupResponse,
  LeadDatosPreventaRequest,
  LeadDetalleResponse,
  LeadInstalacionCorreccionCandidatoResponse,
  LeadInstalacionCorreccionRequest,
  LeadInstalacionCorreccionResponse,
  LeadInstaladoBackofficeResponse,
  LeadDireccionRequest,
  LeadOfertaComercialRequest,
  LeadPage,
  LeadTipificacionVentaRequest,
  LeadTomaVentaRequest,
  LeadVentaGroupFilter,
  LeadVentaGroupsResponse,
  LeadVentaResponse,
  PageQuery,
  PlanResponse,
  PromocionComercialResponse,
  UbigeoItem
} from '../../../shared/models/preventa/preventa.models';

export interface LeadRechazadosFilters {
  fechaDesde?: string | null;
  fechaHasta?: string | null;
}

@Injectable({ providedIn: 'root' })
export class BackofficeLeadService {
  private readonly http = inject(HttpClient);
  private readonly leadUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads`;

  listarPlataforma(
    query: PageQuery,
    lead?: string,
    idEquipo?: number | null,
    range?: LeadRechazadosFilters,
    campoFecha?: string | null,
    groupBy?: string | null
  ): Observable<LeadPage<LeadVentaResponse>> {
    let params = this.pageParams(query);
    if (lead) {
      params = params.set('lead', lead);
    }
    if (idEquipo !== null && idEquipo !== undefined) {
      params = params.set('idEquipo', idEquipo);
    }
    params = this.rangeParams(params, range);
    if (campoFecha) {
      params = params.set('campoFecha', campoFecha);
    }
    if (groupBy) {
      params = params.set('groupBy', groupBy);
    }
    return this.http.get<LeadPage<LeadVentaResponse>>(`${this.leadUrl}/venta`, { params });
  }

  listarAgrupacionesPlataforma(
    lead?: string,
    idEquipo?: number | null,
    range?: LeadRechazadosFilters
  ): Observable<LeadVentaGroupsResponse> {
    let params = new HttpParams();
    if (lead) {
      params = params.set('lead', lead);
    }
    if (idEquipo !== null && idEquipo !== undefined) {
      params = params.set('idEquipo', idEquipo);
    }
    params = this.rangeParams(params, range);
    return this.http.get<LeadVentaGroupsResponse>(`${this.leadUrl}/venta/agrupaciones`, { params });
  }

  buscarContextoLead(lead: string): Observable<LeadContextoLookupResponse> {
    return this.http.get<LeadContextoLookupResponse>(`${this.leadUrl}/venta/lookup`, {
      params: new HttpParams().set('lead', lead)
    });
  }

  listarProgramados(
    query: PageQuery,
    idEquipo?: number | null,
    range?: LeadRechazadosFilters,
    campoFecha?: string | null,
    groupBy?: string | null
  ): Observable<LeadPage<LeadVentaResponse>> {
    let params = this.pageParams(query);
    if (idEquipo !== null && idEquipo !== undefined) {
      params = params.set('idEquipo', idEquipo);
    }
    params = this.rangeParams(params, range);
    if (campoFecha) {
      params = params.set('campoFecha', campoFecha);
    }
    if (groupBy) {
      params = params.set('groupBy', groupBy);
    }
    return this.http.get<LeadPage<LeadVentaResponse>>(`${this.leadUrl}/venta/programados/asignados`, { params });
  }

  listarRechazados(
    query: PageQuery,
    filters: LeadRechazadosFilters,
    idEquipo?: number | null,
    campoFecha?: string | null,
    groupBy?: string | null
  ): Observable<LeadPage<LeadVentaResponse>> {
    let params = this.pageParams(query);
    if (filters.fechaDesde) {
      params = params.set('fechaDesde', filters.fechaDesde);
    }
    if (filters.fechaHasta) {
      params = params.set('fechaHasta', filters.fechaHasta);
    }
    if (idEquipo !== null && idEquipo !== undefined) {
      params = params.set('idEquipo', idEquipo);
    }
    if (campoFecha) {
      params = params.set('campoFecha', campoFecha);
    }
    if (groupBy) {
      params = params.set('groupBy', groupBy);
    }
    return this.http.get<LeadPage<LeadVentaResponse>>(`${this.leadUrl}/venta/rechazados`, { params });
  }

  listarSubsanables(
    query: PageQuery,
    filters: LeadRechazadosFilters,
    idEquipo?: number | null,
    campoFecha?: string | null,
    groupBy?: string | null
  ): Observable<LeadPage<LeadVentaResponse>> {
    let params = this.pageParams(query);
    if (filters.fechaDesde) {
      params = params.set('fechaDesde', filters.fechaDesde);
    }
    if (filters.fechaHasta) {
      params = params.set('fechaHasta', filters.fechaHasta);
    }
    if (idEquipo !== null && idEquipo !== undefined) {
      params = params.set('idEquipo', idEquipo);
    }
    if (campoFecha) {
      params = params.set('campoFecha', campoFecha);
    }
    if (groupBy) {
      params = params.set('groupBy', groupBy);
    }
    return this.http.get<LeadPage<LeadVentaResponse>>(`${this.leadUrl}/venta/subsanables`, { params });
  }

  listarInstalados(
    query: PageQuery,
    filters: LeadRechazadosFilters,
    idEquipo?: number | null,
    campoFecha?: string | null,
    groupBy?: string | null
  ): Observable<LeadPage<LeadInstaladoBackofficeResponse>> {
    let params = this.pageParams(query);
    if (filters.fechaDesde) {
      params = params.set('fechaDesde', filters.fechaDesde);
    }
    if (filters.fechaHasta) {
      params = params.set('fechaHasta', filters.fechaHasta);
    }
    if (idEquipo !== null && idEquipo !== undefined) {
      params = params.set('idEquipo', idEquipo);
    }
    if (campoFecha) {
      params = params.set('campoFecha', campoFecha);
    }
    if (groupBy) {
      params = params.set('groupBy', groupBy);
    }
    return this.http.get<LeadPage<LeadInstaladoBackofficeResponse>>(`${this.leadUrl}/venta/instalados`, { params });
  }

  listarCorreccionesInstalacion(
    query: PageQuery,
    buscar?: string | null,
    idEquipo?: number | null
  ): Observable<LeadPage<LeadInstalacionCorreccionCandidatoResponse>> {
    let params = this.pageParams(query);
    if (buscar) {
      params = params.set('buscar', buscar);
    }
    if (idEquipo !== null && idEquipo !== undefined) {
      params = params.set('idEquipo', idEquipo);
    }
    return this.http.get<LeadPage<LeadInstalacionCorreccionCandidatoResponse>>(
      `${this.leadUrl}/venta/correcciones/instalacion`,
      { params }
    );
  }

  corregirInstalacion(
    idLead: number,
    request: LeadInstalacionCorreccionRequest
  ): Observable<LeadInstalacionCorreccionResponse> {
    return this.http.patch<LeadInstalacionCorreccionResponse>(
      `${this.leadUrl}/venta/${idLead}/corregir-instalacion`,
      request
    );
  }

  tomarLead(idLead: number, request: LeadTomaVentaRequest = {}): Observable<void> {
    return this.http.patch<void>(`${this.leadUrl}/venta/${idLead}/asignacion`, request);
  }

  liberarAsignacion(idLead: number): Observable<void> {
    return this.http.delete<void>(`${this.leadUrl}/venta/${idLead}/asignacion`);
  }

  registrarContacto(idLead: number): Observable<void> {
    return this.http.patch<void>(`${this.leadUrl}/venta/${idLead}/contacto`, {});
  }

  obtenerDetalle(idLead: number): Observable<LeadDetalleResponse> {
    return this.http.get<LeadDetalleResponse>(`${this.leadUrl}/venta/${idLead}/detalle-asesor`);
  }

  obtenerDetalleConsulta(idLead: number): Observable<LeadDetalleResponse> {
    return this.http.get<LeadDetalleResponse>(`${this.leadUrl}/venta/${idLead}/detalle-consulta`);
  }

  listarPlanesOferta(idLead: number): Observable<PlanResponse[]> {
    return this.http.get<PlanResponse[]>(`${this.leadUrl}/venta/${idLead}/planes-oferta`);
  }

  listarEventos(idLead: number, query: PageQuery): Observable<LeadPage<EventoResponse>> {
    return this.http.get<LeadPage<EventoResponse>>(`${this.leadUrl}/eventos/lead/${idLead}`, {
      params: this.pageParams(query).set('accion', 'TIPIFICACION')
    });
  }

  listarEventosConsulta(idLead: number, query: PageQuery): Observable<LeadPage<EventoResponse>> {
    return this.http.get<LeadPage<EventoResponse>>(`${this.leadUrl}/venta/${idLead}/eventos-consulta`, {
      params: this.pageParams(query)
    });
  }

  actualizarDatosPreventa(idLead: number, request: LeadDatosPreventaRequest): Observable<void> {
    return this.http.patch<void>(`${this.leadUrl}/venta/${idLead}/datos-preventa`, request);
  }

  actualizarDireccion(idLead: number, request: LeadDireccionRequest): Observable<void> {
    return this.http.patch<void>(`${this.leadUrl}/venta/${idLead}/direccion`, request);
  }

  actualizarOfertaComercial(idLead: number, request: LeadOfertaComercialRequest): Observable<void> {
    return this.http.patch<void>(`${this.leadUrl}/venta/${idLead}/oferta-comercial`, request);
  }

  tipificarLead(idLead: number, request: LeadTipificacionVentaRequest): Observable<void> {
    return this.http.patch<void>(`${this.leadUrl}/venta/${idLead}/tipificacion`, request);
  }

  // Catálogo VENTA para tipificar un lead concreto: el backend resuelve el equipo desde el lead.
  getCatalogoTipificaciones(idLead: number): Observable<CatalogoResponse> {
    return this.http.get<CatalogoResponse>(`${this.leadUrl}/tipificaciones/lead/${idLead}/VENTA/catalogo`);
  }

  // Catálogo AGREGADO cross-equipo (unión por código) para la paleta/filtro de la bandeja.
  getCatalogoAgregado(etapa: string): Observable<CatalogoResponse> {
    return this.http.get<CatalogoResponse>(`${this.leadUrl}/tipificaciones/${etapa}/catalogo-agregado`);
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

  listarDepartamentos(): Observable<UbigeoItem[]> {
    return this.http.get<UbigeoItem[]>(`${this.leadUrl}/ubigeo/departamentos`);
  }

  listarProvincias(idDepartamento: number): Observable<UbigeoItem[]> {
    return this.http.get<UbigeoItem[]>(`${this.leadUrl}/ubigeo/departamentos/${idDepartamento}/provincias`);
  }

  listarDistritos(idProvincia: number): Observable<UbigeoItem[]> {
    return this.http.get<UbigeoItem[]>(`${this.leadUrl}/ubigeo/provincias/${idProvincia}/distritos`);
  }

  private pageParams(query: PageQuery): HttpParams {
    return new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize)
      .set('sortBy', query.sortBy)
      .set('direction', query.direction);
  }

  private rangeParams(params: HttpParams, range?: LeadRechazadosFilters): HttpParams {
    let next = params;
    if (range?.fechaDesde) {
      next = next.set('fechaDesde', range.fechaDesde);
    }
    if (range?.fechaHasta) {
      next = next.set('fechaHasta', range.fechaHasta);
    }
    return next;
  }

  private groupParams(params: HttpParams, groupFilter?: LeadVentaGroupFilter): HttpParams {
    if (!groupFilter?.tipoGrupo) {
      return params;
    }
    let next = params.set('tipoGrupo', groupFilter.tipoGrupo);
    for (const value of groupFilter.valorGrupo ?? []) {
      next = next.append('valorGrupo', value);
    }
    if (groupFilter.sinValor) {
      next = next.set('sinValor', true);
    }
    return next;
  }
}
