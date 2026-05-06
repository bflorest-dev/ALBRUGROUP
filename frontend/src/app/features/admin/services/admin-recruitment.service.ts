import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { PageResponse } from '../../../shared/models/common/page-response';
import { ActualizarEstadoOfertaLaboralRequest } from '../../../shared/models/recruitment/actualizar-estado-oferta-laboral-request';
import { OfertaAmpliacionRequest } from '../../../shared/models/recruitment/oferta-ampliacion-request';
import { OfertaAmpliacionResponse } from '../../../shared/models/recruitment/oferta-ampliacion-response';
import { OfertaLaboralRequest } from '../../../shared/models/recruitment/oferta-laboral-request';
import { OfertaLaboralResponse } from '../../../shared/models/recruitment/oferta-laboral-response';

@Injectable({
  providedIn: 'root'
})
export class AdminRecruitmentService {
  private readonly ofertasUrl = `${API_CONSTANTS.gatewayBaseUrl}/recruitment/ofertas-laborales`;

  constructor(private readonly http: HttpClient) {}

  listarOfertas(
    pageNumber = 0,
    pageSize = 8,
    estado: string | null = null
  ): Observable<PageResponse<OfertaLaboralResponse>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize)
      .set('sortBy', 'createdAt')
      .set('direction', 'desc');

    if (estado) {
      params = params.set('estado', estado);
    }

    return this.http.get<PageResponse<OfertaLaboralResponse>>(this.ofertasUrl, { params });
  }

  registrarOferta(request: OfertaLaboralRequest): Observable<OfertaLaboralResponse> {
    return this.http.post<OfertaLaboralResponse>(this.ofertasUrl, request);
  }

  registrarAmpliacion(
    idOfertaLaboral: number,
    request: OfertaAmpliacionRequest
  ): Observable<OfertaAmpliacionResponse> {
    return this.http.post<OfertaAmpliacionResponse>(
      `${this.ofertasUrl}/${idOfertaLaboral}/ampliacion`,
      request
    );
  }

  actualizarEstado(
    idOfertaLaboral: number,
    request: ActualizarEstadoOfertaLaboralRequest
  ): Observable<OfertaLaboralResponse> {
    return this.http.patch<OfertaLaboralResponse>(
      `${this.ofertasUrl}/${idOfertaLaboral}/estado`,
      request
    );
  }
}
