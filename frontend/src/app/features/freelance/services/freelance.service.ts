import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { UbigeoItem } from '../../../shared/models/preventa/preventa.models';
import {
  FreelanceOpciones,
  FreelanceIdentidadDisponibilidad,
  FreelanceSeguimiento,
  FreelanceVentaCrearRequest,
  FreelanceVentaPreparacion,
  FreelanceVentaReenvioRequest,
  FreelanceVentaResponse
} from '../models/freelance.models';

@Injectable({ providedIn: 'root' })
export class FreelanceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads/freelance`;
  private readonly leadUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads`;

  opciones(idProveedor?: number | null): Observable<FreelanceOpciones> {
    let params = new HttpParams();
    if (idProveedor) params = params.set('idProveedor', idProveedor);
    return this.http.get<FreelanceOpciones>(`${this.baseUrl}/opciones`, { params });
  }

  validarIdentidad(prefijo: string, lead: string, usermeta?: string | null): Observable<FreelanceIdentidadDisponibilidad> {
    let params = new HttpParams().set('prefijo', prefijo).set('lead', lead);
    if (usermeta?.trim()) params = params.set('usermeta', usermeta.trim());
    return this.http.get<FreelanceIdentidadDisponibilidad>(`${this.baseUrl}/identidad/disponibilidad`, { params });
  }

  seguimiento(desde: string, hasta: string, idProveedor?: number | null): Observable<FreelanceSeguimiento> {
    let params = new HttpParams().set('desde', desde).set('hasta', hasta);
    if (idProveedor) params = params.set('idProveedor', idProveedor);
    return this.http.get<FreelanceSeguimiento>(`${this.baseUrl}/seguimiento`, { params });
  }

  preparar(idLead: number): Observable<FreelanceVentaPreparacion> {
    return this.http.get<FreelanceVentaPreparacion>(`${this.baseUrl}/ventas/${idLead}`);
  }

  crear(request: FreelanceVentaCrearRequest): Observable<FreelanceVentaResponse> {
    return this.http.post<FreelanceVentaResponse>(`${this.baseUrl}/ventas`, request);
  }

  reenviar(idLead: number, request: FreelanceVentaReenvioRequest): Observable<FreelanceVentaResponse> {
    return this.http.put<FreelanceVentaResponse>(`${this.baseUrl}/ventas/${idLead}/reenviar`, request);
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
}
