import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { UsuarioResponse } from '../../../shared/models/auth/usuario-response';
import { PageResponse } from '../../../shared/models/common/page-response';
import { EventoResponse as LeadEventoResponse } from '../../../shared/models/preventa/preventa.models';
import { CatalogoTipificacionResponse } from '../../../shared/models/recruitment/catalogo-tipificacion-response';
import { EventoResponse } from '../../../shared/models/recruitment/evento-response';
import { GrupoCapacitacionResponse } from '../../../shared/models/recruitment/grupo-capacitacion-response';
import { PostulacionResponse } from '../../../shared/models/recruitment/postulacion-response';
import { TipificarPostulacionRequest } from '../../../shared/models/recruitment/tipificar-postulacion-request';

@Injectable({
  providedIn: 'root'
})
export class TrainerRecruitmentService {
  private readonly recruitmentUrl = `${API_CONSTANTS.gatewayBaseUrl}/recruitment`;
  private readonly authUrl = `${API_CONSTANTS.gatewayBaseUrl}${API_CONSTANTS.authBasePath}`;
  private readonly leadUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads`;
  private readonly postulacionesUrl = `${this.recruitmentUrl}/postulaciones`;
  private readonly groupsUrl = `${this.recruitmentUrl}/grupos-capacitacion`;

  constructor(private readonly http: HttpClient) {}

  obtenerCatalogoCapacitacion(): Observable<CatalogoTipificacionResponse> {
    return this.http.get<CatalogoTipificacionResponse>(
      `${this.recruitmentUrl}/tipificaciones/CAPACITACION/catalogo`
    );
  }

  listarBandejaCapacitacion(
    sinGrupo: boolean | null,
    pageNumber = 0,
    pageSize = 12
  ): Observable<PageResponse<PostulacionResponse>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize)
      .set('sortBy', 'updatedAt')
      .set('direction', 'desc');

    if (sinGrupo !== null) {
      params = params.set('sinGrupo', sinGrupo);
    }

    return this.http.get<PageResponse<PostulacionResponse>>(
      `${this.postulacionesUrl}/bandeja/capacitacion`,
      { params }
    );
  }

  listarGruposAbiertos(pageNumber = 0, pageSize = 100): Observable<PageResponse<GrupoCapacitacionResponse>> {
    const params = new HttpParams()
      .set('estado', 'ABIERTO')
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize)
      .set('sortBy', 'fechaInicio')
      .set('direction', 'asc');

    return this.http.get<PageResponse<GrupoCapacitacionResponse>>(this.groupsUrl, { params });
  }

  obtenerGrupo(idGrupoCapacitacion: number): Observable<GrupoCapacitacionResponse> {
    return this.http.get<GrupoCapacitacionResponse>(`${this.groupsUrl}/${idGrupoCapacitacion}`);
  }

  listarEventos(idPostulacion: number): Observable<PageResponse<EventoResponse>> {
    const params = new HttpParams()
      .set('pageNumber', 0)
      .set('pageSize', 12)
      .set('sortBy', 'createdAt')
      .set('direction', 'desc');

    return this.http.get<PageResponse<EventoResponse>>(
      `${this.postulacionesUrl}/${idPostulacion}/eventos`,
      { params }
    );
  }

  listarUsuariosOjt(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(`${this.authUrl}/roles/OJT/usuarios`);
  }

  listarEventosOjtEmpleado(
    idEmpleado: number,
    fechaDesde: string,
    fechaHasta: string,
    pageSize = 200
  ): Observable<PageResponse<LeadEventoResponse>> {
    const params = new HttpParams()
      .set('fechaDesde', fechaDesde)
      .set('fechaHasta', fechaHasta)
      .set('pageNumber', 0)
      .set('pageSize', pageSize)
      .set('sortBy', 'createdAt')
      .set('direction', 'desc');

    return this.http.get<PageResponse<LeadEventoResponse>>(
      `${this.leadUrl}/eventos/empleado/${idEmpleado}`,
      { params }
    );
  }

  tipificarPostulacion(
    idPostulacion: number,
    request: TipificarPostulacionRequest
  ): Observable<PostulacionResponse> {
    return this.http.post<PostulacionResponse>(
      `${this.postulacionesUrl}/${idPostulacion}/tipificacion`,
      request
    );
  }
}
