import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AjusteJornadaRequest,
  AjusteJornadaResponse,
  JornadaEfectivaResponse,
  PreviewAjusteJornadaResponse,
  RegistrarAjusteV2Request
} from '../../shared/models/schedule/jornada-efectiva-response';
import { API_CONSTANTS } from '../constants/api.constants';

@Injectable({ providedIn: 'root' })
export class ScheduleAdjustmentService {
  private readonly http = inject(HttpClient);
  private readonly scheduleUrl = `${API_CONSTANTS.gatewayBaseUrl}/schedule/horarios/empleados`;
  private readonly asistenciaV2Url = `${API_CONSTANTS.gatewayBaseUrl}/schedule/asistencia/v2/empleados`;
  private readonly gtrUrl = `${API_CONSTANTS.gatewayBaseUrl}/monitor/gtr/asesores-ventas`;

  getJornada(idEmpleado: number, fecha?: string): Observable<JornadaEfectivaResponse> {
    const params = fecha ? new HttpParams().set('fecha', fecha) : undefined;
    return this.http.get<JornadaEfectivaResponse>(
      `${this.scheduleUrl}/${idEmpleado}/jornada-efectiva`,
      { params }
    );
  }

  preview(
    idEmpleado: number,
    request: AjusteJornadaRequest
  ): Observable<PreviewAjusteJornadaResponse> {
    return this.http.post<PreviewAjusteJornadaResponse>(
      `${this.scheduleUrl}/${idEmpleado}/ajustes/preview`,
      request
    );
  }

  registrar(idEmpleado: number, request: AjusteJornadaRequest): Observable<AjusteJornadaResponse> {
    return this.http.post<AjusteJornadaResponse>(
      `${this.scheduleUrl}/${idEmpleado}/ajustes`,
      request
    );
  }

  /** Ajuste v2 con RAZÓN (motor nuevo): ampliación operativa / compensación / corrimiento. */
  registrarV2(idEmpleado: number, request: RegistrarAjusteV2Request): Observable<AjusteJornadaResponse> {
    return this.http.post<AjusteJornadaResponse>(
      `${this.asistenciaV2Url}/${idEmpleado}/ajustes`,
      request
    );
  }

  listar(idEmpleado: number, fecha: string): Observable<AjusteJornadaResponse[]> {
    return this.http.get<AjusteJornadaResponse[]>(`${this.scheduleUrl}/${idEmpleado}/ajustes`, {
      params: new HttpParams().set('fecha', fecha)
    });
  }

  cancelar(idEmpleado: number, idAjuste: number): Observable<AjusteJornadaResponse> {
    return this.http.post<AjusteJornadaResponse>(
      `${this.scheduleUrl}/${idEmpleado}/ajustes/${idAjuste}/cancelar`,
      {}
    );
  }

  getJornadaGtr(idEmpleado: number): Observable<JornadaEfectivaResponse> {
    return this.http.get<JornadaEfectivaResponse>(
      `${this.gtrUrl}/${idEmpleado}/jornada-efectiva`
    );
  }

  previewGtr(
    idEmpleado: number,
    request: AjusteJornadaRequest
  ): Observable<PreviewAjusteJornadaResponse> {
    return this.http.post<PreviewAjusteJornadaResponse>(
      `${this.gtrUrl}/${idEmpleado}/ajustes/preview`,
      request
    );
  }

  registrarGtr(idEmpleado: number, request: AjusteJornadaRequest): Observable<AjusteJornadaResponse> {
    return this.http.post<AjusteJornadaResponse>(
      `${this.gtrUrl}/${idEmpleado}/ajustes`,
      request
    );
  }
}
