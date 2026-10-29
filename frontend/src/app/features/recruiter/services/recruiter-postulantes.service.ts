import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { PageResponse } from '../../../shared/models/common/page-response';
import { CatalogoTipificacionResponse } from '../../../shared/models/recruitment/catalogo-tipificacion-response';
import { EventoResponse } from '../../../shared/models/recruitment/evento-response';
import { GrupoCapacitacionResponse } from '../../../shared/models/recruitment/grupo-capacitacion-response';
import { PostulacionResponse } from '../../../shared/models/recruitment/postulacion-response';
import { RegistrarContactoPostulacionRequest } from '../../../shared/models/recruitment/registrar-contacto-postulacion-request';
import { TipificarPostulacionRequest } from '../../../shared/models/recruitment/tipificar-postulacion-request';
import { GestionReclutamiento, GestionRequest, HorarioMeet } from '../../../shared/models/recruitment/gestion-reclutamiento';
import { ContactoPostulacionResponse } from '../../../shared/models/recruitment/contacto-postulacion-response';
import { SesionMeetResponse } from '../../../shared/models/recruitment/sesion-meet-response';
import { EmpleadoRolResponse } from '../../../shared/models/rrhh/empleado-rol-response';

@Injectable({
  providedIn: 'root'
})
export class RecruiterPostulantesService {
  private readonly recruitmentUrl = `${API_CONSTANTS.gatewayBaseUrl}/recruitment`;
  private readonly postulacionesUrl = `${this.recruitmentUrl}/postulaciones`;
  private readonly empleadosUrl = `${API_CONSTANTS.gatewayBaseUrl}/rrhh/empleados`;

  constructor(private readonly http: HttpClient) {}

  obtenerGestion(id:number): Observable<GestionReclutamiento> {
    return this.http.get<GestionReclutamiento>(`${this.postulacionesUrl}/${id}/gestion-reclutamiento`);
  }
  registrarGestion(id:number, request:GestionRequest): Observable<GestionReclutamiento> {
    return this.http.post<GestionReclutamiento>(`${this.postulacionesUrl}/${id}/gestion-reclutamiento`,request);
  }
  listarHorariosMeet(negocio:string): Observable<HorarioMeet[]> {
    return this.http.get<HorarioMeet[]>(`${this.recruitmentUrl}/reclutamiento/meet/horarios`, { params: { negocio } });
  }
  listarSesionesMeet(fecha:string, negocio?:string): Observable<SesionMeetResponse[]> {
    let params = new HttpParams().set('fecha', fecha);
    if (negocio) params = params.set('negocio', negocio);
    return this.http.get<SesionMeetResponse[]>(`${this.recruitmentUrl}/reclutamiento/meet/sesiones`, { params });
  }

  listarEmpleadosLight(empleadoIds: number[]): Observable<EmpleadoRolResponse[]> {
    let params = new HttpParams();
    empleadoIds.forEach(id => params = params.append('empleadoIds', id));
    return this.http.get<EmpleadoRolResponse[]>(`${this.empleadosUrl}/light`, { params });
  }

  listarBandejaReclutamiento(
    estadoBandeja: string,
    pageNumber = 0,
    pageSize = 8,
    idTipificacion?: number
  ): Observable<PageResponse<PostulacionResponse>> {
    let params = new HttpParams()
      .set('estadoBandeja', estadoBandeja)
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize)
      .set('sortBy', 'updatedAt')
      .set('direction', 'desc');
    if (idTipificacion) params = params.set('idTipificacion', idTipificacion);

    return this.http.get<PageResponse<PostulacionResponse>>(
      `${this.postulacionesUrl}/bandeja/reclutamiento`,
      { params }
    );
  }

  obtenerCatalogoReclutamiento(): Observable<CatalogoTipificacionResponse> {
    return this.http.get<CatalogoTipificacionResponse>(
      `${this.recruitmentUrl}/tipificaciones/RECLUTAMIENTO/catalogo`
    );
  }

  listarGruposCapacitacionAbiertos(): Observable<PageResponse<GrupoCapacitacionResponse>> {
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

  listarEventos(idPostulacion: number, pageNumber = 0): Observable<PageResponse<EventoResponse>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', 12)
      .set('sortBy', 'createdAt')
      .set('direction', 'desc');

    return this.http.get<PageResponse<EventoResponse>>(
      `${this.postulacionesUrl}/${idPostulacion}/eventos`,
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

  registrarContacto(
    idPostulacion: number,
    request: RegistrarContactoPostulacionRequest
  ): Observable<ContactoPostulacionResponse> {
    return this.http.post<ContactoPostulacionResponse>(`${this.postulacionesUrl}/${idPostulacion}/contactos`, request);
  }

}
