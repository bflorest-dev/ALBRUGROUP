import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { CampoConfigItem, UbigeoItem } from '../../../shared/models/preventa/preventa.models';
import {
  SubsanacionActaResumen,
  SubsanacionImpacto,
  SubsanacionOpciones,
  SubsanacionPreparacion,
  SubsanacionRequest,
  SubsanacionResponse
} from '../models/subsanacion.models';

@Injectable({ providedIn: 'root' })
export class SubsanacionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads/subsanaciones`;
  private readonly leadUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads`;

  buscarLeads(buscar: string): Observable<SubsanacionImpacto[]> {
    return this.http.get<SubsanacionImpacto[]>(`${this.baseUrl}/leads`, {
      params: new HttpParams().set('buscar', buscar)
    });
  }

  preparar(idLead: number): Observable<SubsanacionPreparacion> {
    return this.http.get<SubsanacionPreparacion>(`${this.baseUrl}/leads/${idLead}/preparacion`);
  }

  opciones(idEquipo: number, idProveedor?: number | null, fechaGestion?: string | null): Observable<SubsanacionOpciones> {
    let params = new HttpParams().set('idEquipo', idEquipo);
    if (idProveedor) params = params.set('idProveedor', idProveedor);
    if (fechaGestion) params = params.set('fechaGestion', fechaGestion);
    return this.http.get<SubsanacionOpciones>(`${this.baseUrl}/opciones`, { params });
  }

  camposCaptura(idProveedor: number): Observable<CampoConfigItem[]> {
    return this.http.get<CampoConfigItem[]>(`${this.leadUrl}/proveedores/${idProveedor}/campos-captura`);
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

  ejecutar(request: SubsanacionRequest): Observable<SubsanacionResponse> {
    return this.http.post<SubsanacionResponse>(this.baseUrl, request);
  }

  obtenerActa(idSubsanacion: number): Observable<SubsanacionResponse> {
    return this.http.get<SubsanacionResponse>(`${this.baseUrl}/${idSubsanacion}`);
  }

  listarActas(idLead: number): Observable<SubsanacionActaResumen[]> {
    return this.http.get<SubsanacionActaResumen[]>(`${this.baseUrl}/leads/${idLead}/actas`);
  }
}
