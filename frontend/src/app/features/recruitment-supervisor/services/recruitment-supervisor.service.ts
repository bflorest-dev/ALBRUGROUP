import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { PageResponse } from '../../../shared/models/common/page-response';
import { GrupoCapacitacionResponse } from '../../../shared/models/recruitment/grupo-capacitacion-response';
import { AltaMetaPostulacionRequest } from '../../../shared/models/recruitment/alta-meta-postulacion-request';
import { ActualizarDatosPostulanteRequest } from '../../../shared/models/recruitment/actualizar-datos-postulante-request';
import { OfertaLaboralResponse } from '../../../shared/models/recruitment/oferta-laboral-response';
import { PostulacionHistorialResponse } from '../../../shared/models/recruitment/postulacion-historial-response';
import { PostulacionRequest } from '../../../shared/models/recruitment/postulacion-request';
import { PostulacionResponse } from '../../../shared/models/recruitment/postulacion-response';
import { PostulanteHistorialResponse } from '../../../shared/models/recruitment/postulante-historial-response';

export type SupervisorListFilters = {
  etapa?: string;
  estado?: string;
  estadoBandeja?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  direction?: string;
};

@Injectable({ providedIn: 'root' })
export class RecruitmentSupervisorService {
  private readonly http = inject(HttpClient);
  private readonly recruitmentUrl = `${API_CONSTANTS.gatewayBaseUrl}/recruitment`;
  private readonly postulacionesUrl = `${this.recruitmentUrl}/postulaciones`;

  listarPostulaciones(filters: SupervisorListFilters = {}): Observable<PageResponse<PostulacionResponse>> {
    let params = new HttpParams()
      .set('pageNumber', filters.pageNumber ?? 0)
      .set('pageSize', filters.pageSize ?? 12)
      .set('sortBy', filters.sortBy ?? 'updatedAt')
      .set('direction', filters.direction ?? 'desc');

    if (filters.etapa) params = params.set('etapa', filters.etapa);
    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.estadoBandeja) params = params.set('estadoBandeja', filters.estadoBandeja);

    return this.http.get<PageResponse<PostulacionResponse>>(
      `${this.postulacionesUrl}/bandeja/supervisor`,
      { params }
    );
  }

  registrarPostulacion(request: PostulacionRequest): Observable<PostulacionResponse> {
    return this.http.post<PostulacionResponse>(this.postulacionesUrl, request);
  }

  registrarPostulacionRapidaMeta(request: AltaMetaPostulacionRequest): Observable<PostulacionResponse> {
    return this.http.post<PostulacionResponse>(`${this.postulacionesUrl}/rapida-meta`, request);
  }

  actualizarDatosPostulante(
    idPostulacion: number,
    request: ActualizarDatosPostulanteRequest
  ): Observable<PostulacionResponse> {
    return this.http.put<PostulacionResponse>(`${this.postulacionesUrl}/${idPostulacion}/datos-postulante`, request);
  }

  actualizarPostulacion(
    idPostulacion: number,
    request: PostulacionRequest
  ): Observable<PostulacionResponse> {
    return this.http.put<PostulacionResponse>(`${this.postulacionesUrl}/${idPostulacion}`, request);
  }

  obtenerHistorial(idPostulante: number): Observable<PostulanteHistorialResponse> {
    return this.http.get<PostulanteHistorialResponse>(
      `${this.recruitmentUrl}/postulantes/${idPostulante}/historial`
    );
  }

  listarOfertasActivas(): Observable<OfertaLaboralResponse[]> {
    return this.http.get<OfertaLaboralResponse[]>(`${this.recruitmentUrl}/ofertas-laborales/activas`);
  }

  listarGruposAbiertos(): Observable<PageResponse<GrupoCapacitacionResponse>> {
    const params = new HttpParams()
      .set('estado', 'ABIERTO')
      .set('pageNumber', 0)
      .set('pageSize', 100)
      .set('sortBy', 'fechaInicio')
      .set('direction', 'asc');

    return this.http.get<PageResponse<GrupoCapacitacionResponse>>(
      `${this.recruitmentUrl}/grupos-capacitacion`,
      { params }
    );
  }

  asignarOferta(idPostulacion: number, idOfertaLaboral: number): Observable<PostulacionResponse> {
    return this.http.patch<PostulacionResponse>(
      `${this.postulacionesUrl}/${idPostulacion}/oferta`,
      { idOfertaLaboral }
    );
  }

  asignarGrupo(idGrupoCapacitacion: number, idPostulacion: number): Observable<unknown> {
    return this.http.post(
      `${this.recruitmentUrl}/grupos-capacitacion/${idGrupoCapacitacion}/postulaciones`,
      { idPostulacion }
    );
  }
}
