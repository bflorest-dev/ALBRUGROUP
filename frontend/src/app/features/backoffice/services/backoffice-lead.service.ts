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
  LeadDireccionRequest,
  LeadOfertaComercialRequest,
  LeadPage,
  LeadTipificacionVentaRequest,
  LeadVentaResponse,
  PageQuery,
  PlanResponse,
  PromocionComercialResponse,
  UbigeoItem
} from '../../../shared/models/preventa/preventa.models';

@Injectable({ providedIn: 'root' })
export class BackofficeLeadService {
  private readonly http = inject(HttpClient);
  private readonly leadUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads`;

  listarPlataforma(query: PageQuery, lead?: string): Observable<LeadPage<LeadVentaResponse>> {
    let params = this.pageParams(query);
    if (lead) {
      params = params.set('lead', lead);
    }
    return this.http.get<LeadPage<LeadVentaResponse>>(`${this.leadUrl}/venta`, { params });
  }

  buscarContextoLead(lead: string): Observable<LeadContextoLookupResponse> {
    return this.http.get<LeadContextoLookupResponse>(`${this.leadUrl}/venta/lookup`, {
      params: new HttpParams().set('lead', lead)
    });
  }

  listarGestion(query: PageQuery): Observable<LeadPage<LeadVentaResponse>> {
    return this.http.get<LeadPage<LeadVentaResponse>>(`${this.leadUrl}/venta/asignados`, { params: this.pageParams(query) });
  }

  tomarLead(idLead: number): Observable<void> {
    return this.http.patch<void>(`${this.leadUrl}/venta/${idLead}/asignacion`, {});
  }

  registrarContacto(idLead: number): Observable<void> {
    return this.http.patch<void>(`${this.leadUrl}/venta/${idLead}/contacto`, {});
  }

  obtenerDetalle(idLead: number): Observable<LeadDetalleResponse> {
    return this.http.get<LeadDetalleResponse>(`${this.leadUrl}/venta/${idLead}/detalle-asesor`);
  }

  listarEventos(idLead: number, query: PageQuery): Observable<LeadPage<EventoResponse>> {
    return this.http.get<LeadPage<EventoResponse>>(`${this.leadUrl}/venta/${idLead}/eventos`, {
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

  getCatalogoTipificaciones(): Observable<CatalogoResponse> {
    return this.http.get<CatalogoResponse>(`${this.leadUrl}/tipificaciones/VENTA/catalogo`);
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
}
