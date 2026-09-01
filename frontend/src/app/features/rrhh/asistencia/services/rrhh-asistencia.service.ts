import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../../core/constants/api.constants';
import { ContratoResponse } from '../../../../shared/models/rrhh/contrato-response';
import { EmpleadoRolResponse } from '../../../../shared/models/rrhh/empleado-rol-response';
import { ConsultaCumplimientoRequest } from '../../../../shared/models/schedule/consulta-cumplimiento-request';
import { CorregirHorarioRequest } from '../../../../shared/models/schedule/corregir-horario-request';
import {
  CumplimientoDetalleResponse,
  CumplimientoResumenResponse,
  EstadoMonitorResponse
} from '../../../../shared/models/schedule/cumplimiento-response';
import { ExcepcionHorarioResponse } from '../../../../shared/models/schedule/excepcion-horario-response';
import { HorarioResponse } from '../../../../shared/models/schedule/horario-response';
import { ReemplazarHorarioRequest } from '../../../../shared/models/schedule/reemplazar-horario-request';
import { RegistrarExcepcionHorarioRequest } from '../../../../shared/models/schedule/registrar-excepcion-horario-request';

/**
 * Encapsula los endpoints que consume la tab RRHH/Asistencia.
 * No mantiene estado de UI; solo HTTP + DTOs.
 */
@Injectable({ providedIn: 'root' })
export class RrhhAsistenciaService {
  private readonly http = inject(HttpClient);
  private readonly empleadosUrl = `${API_CONSTANTS.gatewayBaseUrl}/rrhh/empleados`;
  private readonly contratosUrl = `${API_CONSTANTS.gatewayBaseUrl}/rrhh/contratos`;
  private readonly horariosUrl = `${API_CONSTANTS.gatewayBaseUrl}/schedule/horarios`;
  private readonly revisionUrl = `${API_CONSTANTS.gatewayBaseUrl}/schedule/revision/asistencia`;

  /** Empleados con contrato solapado al periodo de asistencia consultado. */
  listarEmpleadosAsistencia(desde: string, hasta: string, puestosTrabajo?: string[]): Observable<EmpleadoRolResponse[]> {
    let params = new HttpParams();
    params = params.set('desde', desde).set('hasta', hasta);
    (puestosTrabajo ?? []).forEach((puesto) => {
      params = params.append('puestosTrabajo', puesto);
    });
    return this.http.get<EmpleadoRolResponse[]>(`${this.empleadosUrl}/asistencia`, { params });
  }

  getCumplimientoResumen(request: ConsultaCumplimientoRequest): Observable<CumplimientoResumenResponse> {
    return this.http.post<CumplimientoResumenResponse>(`${this.revisionUrl}/cumplimiento/resumen`, request);
  }

  getCumplimientoDetalle(request: ConsultaCumplimientoRequest): Observable<CumplimientoDetalleResponse> {
    return this.http.post<CumplimientoDetalleResponse>(`${this.revisionUrl}/cumplimiento/detalle`, request);
  }

  getEstadosMonitor(empleadoIds: number[], fecha?: string): Observable<EstadoMonitorResponse[]> {
    const body: { empleadoIds: number[]; fecha?: string } = { empleadoIds };
    if (fecha) body.fecha = fecha;
    return this.http.post<EstadoMonitorResponse[]>(`${this.revisionUrl}/monitor/estados`, body);
  }

  getContratoVigente(idEmpleado: number): Observable<ContratoResponse> {
    return this.http.get<ContratoResponse>(`${this.contratosUrl}/${idEmpleado}/vigente`);
  }

  getHorarioVigente(idEmpleado: number, fecha?: string): Observable<HorarioResponse> {
    let params = new HttpParams();
    if (fecha) {
      params = params.set('fecha', fecha);
    }
    return this.http.get<HorarioResponse>(`${this.horariosUrl}/empleados/${idEmpleado}/vigente`, { params });
  }

  corregirHorario(idHorario: number, request: CorregirHorarioRequest): Observable<HorarioResponse> {
    return this.http.patch<HorarioResponse>(`${this.horariosUrl}/${idHorario}`, request);
  }

  reemplazarHorario(idHorario: number, request: ReemplazarHorarioRequest): Observable<HorarioResponse> {
    return this.http.put<HorarioResponse>(`${this.horariosUrl}/${idHorario}`, request);
  }

  registrarExcepcionHorario(
    idHorario: number,
    request: RegistrarExcepcionHorarioRequest
  ): Observable<ExcepcionHorarioResponse> {
    return this.http.post<ExcepcionHorarioResponse>(
      `${this.horariosUrl}/${idHorario}/excepciones`,
      request
    );
  }
}
