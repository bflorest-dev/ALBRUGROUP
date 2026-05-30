import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../constants/api.constants';
import { DetalleAsistenciaResponse } from '../../shared/models/schedule/detalle-asistencia-response';
import { HorarioResponse } from '../../shared/models/schedule/horario-response';
import { MovimientoAsistenciaRequest } from '../../shared/models/schedule/movimiento-asistencia-request';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private readonly scheduleUrl = `${API_CONSTANTS.gatewayBaseUrl}/schedule`;
  private readonly attendanceUrl = `${this.scheduleUrl}/asistencia`;

  constructor(private readonly http: HttpClient) {}

  getAsistenciaDia(fecha?: string): Observable<DetalleAsistenciaResponse> {
    const params = fecha ? new HttpParams().set('fecha', fecha) : undefined;
    return this.http.get<DetalleAsistenciaResponse>(`${this.attendanceUrl}/dia`, { params });
  }

  getAsistenciaMes(anio?: number, mes?: number): Observable<DetalleAsistenciaResponse[]> {
    let params = new HttpParams();
    if (anio !== undefined) params = params.set('anio', anio);
    if (mes !== undefined) params = params.set('mes', mes);
    return this.http.get<DetalleAsistenciaResponse[]>(`${this.attendanceUrl}/mes`, { params });
  }

  getHorarioMes(anio?: number, mes?: number): Observable<HorarioResponse[]> {
    let params = new HttpParams();
    if (anio !== undefined) params = params.set('anio', anio);
    if (mes !== undefined) params = params.set('mes', mes);
    return this.http.get<HorarioResponse[]>(`${this.scheduleUrl}/horarios/mes`, { params });
  }

  registrarIngreso(request: MovimientoAsistenciaRequest): Observable<DetalleAsistenciaResponse> {
    return this.http.post<DetalleAsistenciaResponse>(`${this.attendanceUrl}/ingreso`, request);
  }

  registrarSalida(request: MovimientoAsistenciaRequest): Observable<DetalleAsistenciaResponse> {
    return this.http.post<DetalleAsistenciaResponse>(`${this.attendanceUrl}/salida`, request);
  }

  iniciarAlmuerzo(request: MovimientoAsistenciaRequest): Observable<DetalleAsistenciaResponse> {
    return this.http.post<DetalleAsistenciaResponse>(`${this.attendanceUrl}/almuerzo/inicio`, request);
  }

  finalizarAlmuerzo(request: MovimientoAsistenciaRequest): Observable<DetalleAsistenciaResponse> {
    return this.http.post<DetalleAsistenciaResponse>(`${this.attendanceUrl}/almuerzo/fin`, request);
  }

  iniciarServicios(request: MovimientoAsistenciaRequest): Observable<DetalleAsistenciaResponse> {
    return this.http.post<DetalleAsistenciaResponse>(`${this.attendanceUrl}/servicios/inicio`, request);
  }

  finalizarServicios(request: MovimientoAsistenciaRequest): Observable<DetalleAsistenciaResponse> {
    return this.http.post<DetalleAsistenciaResponse>(`${this.attendanceUrl}/servicios/fin`, request);
  }
}
