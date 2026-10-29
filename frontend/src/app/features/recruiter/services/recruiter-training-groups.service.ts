import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { PageResponse } from '../../../shared/models/common/page-response';
import { ActualizarDetalleGrupoCapacitacionRequest } from '../../../shared/models/recruitment/actualizar-detalle-grupo-capacitacion-request';
import { AsignarPostulacionesGrupoCapacitacionRequest } from '../../../shared/models/recruitment/asignar-postulaciones-grupo-capacitacion-request';
import { GrupoCapacitacionRequest } from '../../../shared/models/recruitment/grupo-capacitacion-request';
import { GrupoCapacitacionDetalleResponse } from '../../../shared/models/recruitment/grupo-capacitacion-detalle-response';
import { GrupoCapacitacionResponse } from '../../../shared/models/recruitment/grupo-capacitacion-response';
import { TrasladarPostulacionesGrupoCapacitacionRequest } from '../../../shared/models/recruitment/trasladar-postulaciones-grupo-capacitacion-request';
import { EmpleadoRolResponse } from '../../../shared/models/rrhh/empleado-rol-response';

@Injectable({
  providedIn: 'root'
})
export class RecruiterTrainingGroupsService {
  private readonly recruitmentUrl = `${API_CONSTANTS.gatewayBaseUrl}/recruitment`;
  private readonly rrhhUrl = `${API_CONSTANTS.gatewayBaseUrl}/rrhh`;
  private readonly groupsUrl = `${this.recruitmentUrl}/grupos-capacitacion`;

  constructor(private readonly http: HttpClient) {}

  listarCapacitadores(): Observable<EmpleadoRolResponse[]> {
    return this.http.get<EmpleadoRolResponse[]>(`${this.rrhhUrl}/empleados/capacitadores`);
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

  asignarPostulaciones(
    idGrupoCapacitacion: number,
    idsPostulaciones: number[]
  ): Observable<GrupoCapacitacionDetalleResponse[]> {
    const request: AsignarPostulacionesGrupoCapacitacionRequest = { idsPostulaciones };
    return this.http.post<GrupoCapacitacionDetalleResponse[]>(
      `${this.groupsUrl}/${idGrupoCapacitacion}/postulaciones:asignar`,
      request
    );
  }

  trasladarPostulaciones(
    idGrupoDestino: number,
    idGrupoOrigen: number,
    idsPostulaciones: number[]
  ): Observable<GrupoCapacitacionDetalleResponse[]> {
    const request: TrasladarPostulacionesGrupoCapacitacionRequest = { idGrupoOrigen, idsPostulaciones };
    return this.http.post<GrupoCapacitacionDetalleResponse[]>(
      `${this.groupsUrl}/${idGrupoDestino}/postulaciones:mover`,
      request
    );
  }

  retirarPostulacion(idGrupoCapacitacion: number, idPostulacion: number): Observable<void> {
    return this.http.delete<void>(
      `${this.groupsUrl}/${idGrupoCapacitacion}/postulaciones/${idPostulacion}`
    );
  }

  obtenerGrupo(idGrupoCapacitacion: number): Observable<GrupoCapacitacionResponse> {
    return this.http.get<GrupoCapacitacionResponse>(`${this.groupsUrl}/${idGrupoCapacitacion}`);
  }

  actualizarDetalleGrupo(
    idGrupoCapacitacion: number,
    idPostulacion: number,
    request: ActualizarDetalleGrupoCapacitacionRequest
  ): Observable<GrupoCapacitacionDetalleResponse> {
    return this.http.patch<GrupoCapacitacionDetalleResponse>(
      `${this.groupsUrl}/${idGrupoCapacitacion}/postulaciones/${idPostulacion}`,
      request
    );
  }
}
