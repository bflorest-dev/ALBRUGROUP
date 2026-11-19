import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../constants/api.constants';
import { AltaMetaPostulacionRequest } from '../../shared/models/recruitment/alta-meta-postulacion-request';
import { OfertaLaboralResponse } from '../../shared/models/recruitment/oferta-laboral-response';
import { PostulacionRequest } from '../../shared/models/recruitment/postulacion-request';
import { PostulacionResponse } from '../../shared/models/recruitment/postulacion-response';
import { RecruitmentNegocio } from './current-user-recruitment-negocio-scope.service';

@Injectable({ providedIn: 'root' })
export class RecruitmentPostulacionService {
  private readonly http = inject(HttpClient);
  private readonly recruitmentUrl = `${API_CONSTANTS.gatewayBaseUrl}/recruitment`;
  private readonly postulacionesUrl = `${this.recruitmentUrl}/postulaciones`;

  registrarPostulacion(request: PostulacionRequest): Observable<PostulacionResponse> {
    return this.http.post<PostulacionResponse>(this.postulacionesUrl, request);
  }

  registrarPostulacionRapidaMeta(request: AltaMetaPostulacionRequest): Observable<PostulacionResponse> {
    return this.http.post<PostulacionResponse>(`${this.postulacionesUrl}/rapida-meta`, request);
  }

  listarOfertasActivas(negocio: RecruitmentNegocio): Observable<OfertaLaboralResponse[]> {
    const params = new HttpParams().set('negocio', negocio);
    return this.http.get<OfertaLaboralResponse[]>(`${this.recruitmentUrl}/ofertas-laborales/activas`, { params });
  }
}
