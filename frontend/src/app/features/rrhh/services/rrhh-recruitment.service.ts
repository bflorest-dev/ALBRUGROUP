import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { PageResponse } from '../../../shared/models/common/page-response';
import { EventoResponse } from '../../../shared/models/recruitment/evento-response';
import { OfertaLaboralResponse } from '../../../shared/models/recruitment/oferta-laboral-response';
import { PostulacionRequest } from '../../../shared/models/recruitment/postulacion-request';
import { PostulacionResponse } from '../../../shared/models/recruitment/postulacion-response';

export type PostulacionFilters = {
  etapa: string | null;
  estado: string | null;
  estadoBandeja: string | null;
};

@Injectable({
  providedIn: 'root'
})
export class RrhhRecruitmentService {
  private readonly recruitmentUrl = `${API_CONSTANTS.gatewayBaseUrl}/recruitment`;
  private readonly postulacionesUrl = `${this.recruitmentUrl}/postulaciones`;
  private readonly ofertasActivasUrl = `${this.recruitmentUrl}/ofertas-laborales/activas`;

  constructor(private readonly http: HttpClient) {}

  listarOfertasActivas(): Observable<OfertaLaboralResponse[]> {
    return this.http.get<OfertaLaboralResponse[]>(this.ofertasActivasUrl);
  }

  listarPostulaciones(
    filters: PostulacionFilters,
    pageNumber = 0,
    pageSize = 8
  ): Observable<PageResponse<PostulacionResponse>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize)
      .set('sortBy', 'createdAt')
      .set('direction', 'desc');

    if (filters.etapa) {
      params = params.set('etapa', filters.etapa);
    }

    if (filters.estado) {
      params = params.set('estado', filters.estado);
    }

    if (filters.estadoBandeja) {
      params = params.set('estadoBandeja', filters.estadoBandeja);
    }

    return this.http.get<PageResponse<PostulacionResponse>>(this.postulacionesUrl, { params });
  }

  registrarPostulacion(request: PostulacionRequest): Observable<PostulacionResponse> {
    return this.http.post<PostulacionResponse>(this.postulacionesUrl, request);
  }

  editarPostulacion(
    idPostulacion: number,
    request: PostulacionRequest
  ): Observable<PostulacionResponse> {
    return this.http.put<PostulacionResponse>(`${this.postulacionesUrl}/${idPostulacion}`, request);
  }

  listarBandejaContratacion(
    pageNumber = 0,
    pageSize = 8
  ): Observable<PageResponse<PostulacionResponse>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize)
      .set('sortBy', 'updatedAt')
      .set('direction', 'desc');

    return this.http.get<PageResponse<PostulacionResponse>>(
      `${this.postulacionesUrl}/bandeja/contratacion`,
      { params }
    );
  }

  listarEventosPostulacion(
    idPostulacion: number,
    pageNumber = 0,
    pageSize = 8
  ): Observable<PageResponse<EventoResponse>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize)
      .set('sortBy', 'createdAt')
      .set('direction', 'desc');

    return this.http.get<PageResponse<EventoResponse>>(
      `${this.postulacionesUrl}/${idPostulacion}/eventos`,
      { params }
    );
  }
}
