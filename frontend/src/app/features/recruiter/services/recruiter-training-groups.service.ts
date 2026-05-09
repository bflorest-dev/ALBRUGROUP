import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { UsuarioResponse } from '../../../shared/models/auth/usuario-response';
import { PageResponse } from '../../../shared/models/common/page-response';
import { GrupoCapacitacionRequest } from '../../../shared/models/recruitment/grupo-capacitacion-request';
import { GrupoCapacitacionResponse } from '../../../shared/models/recruitment/grupo-capacitacion-response';

@Injectable({
  providedIn: 'root'
})
export class RecruiterTrainingGroupsService {
  private readonly recruitmentUrl = `${API_CONSTANTS.gatewayBaseUrl}/recruitment`;
  private readonly authUrl = `${API_CONSTANTS.gatewayBaseUrl}${API_CONSTANTS.authBasePath}`;
  private readonly groupsUrl = `${this.recruitmentUrl}/grupos-capacitacion`;

  constructor(private readonly http: HttpClient) {}

  listarCapacitadores(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(`${this.authUrl}/roles/CAPACITADOR/usuarios`);
  }

  listarGrupos(
    estado: string | null,
    pageNumber = 0,
    pageSize = 8
  ): Observable<PageResponse<GrupoCapacitacionResponse>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize)
      .set('sortBy', 'createdAt')
      .set('direction', 'desc');

    if (estado) {
      params = params.set('estado', estado);
    }

    return this.http.get<PageResponse<GrupoCapacitacionResponse>>(this.groupsUrl, { params });
  }

  crearGrupo(request: GrupoCapacitacionRequest): Observable<GrupoCapacitacionResponse> {
    return this.http.post<GrupoCapacitacionResponse>(this.groupsUrl, request);
  }

  obtenerGrupo(idGrupoCapacitacion: number): Observable<GrupoCapacitacionResponse> {
    return this.http.get<GrupoCapacitacionResponse>(`${this.groupsUrl}/${idGrupoCapacitacion}`);
  }
}
