import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { PageResponse } from '../../../shared/models/common/page-response';
import { ContratoResponse } from '../../../shared/models/rrhh/contrato-response';
import { EmpleadoResponse } from '../../../shared/models/rrhh/empleado-response';
import { EmpleadoRolResponse } from '../../../shared/models/rrhh/empleado-rol-response';
import { EmpresaContratistaResponse } from '../../../shared/models/rrhh/empresa-contratista-response';
import { RegistrarContratoRequest } from '../../../shared/models/rrhh/registrar-contrato-request';
import { ActualizarDatosPersonalesRequest } from '../../../shared/models/rrhh/actualizar-datos-personales-request';
import { EstadoMonitorResponse } from '../../../shared/models/schedule/cumplimiento-response';
import { RegistrarEmpleadoRequest } from '../../../shared/models/rrhh/registrar-empleado-request';
import { HorarioResponse } from '../../../shared/models/schedule/horario-response';
import { RegistrarHorarioRequest } from '../../../shared/models/schedule/registrar-horario-request';

@Injectable({
  providedIn: 'root'
})
export class AdminRrhhService {
  private readonly empleadosUrl = `${API_CONSTANTS.gatewayBaseUrl}/rrhh/empleados`;
  private readonly contratosUrl = `${API_CONSTANTS.gatewayBaseUrl}/rrhh/contratos`;
  private readonly empresasContratistasUrl = `${API_CONSTANTS.gatewayBaseUrl}/rrhh/empresas-contratistas`;
  private readonly horariosUrl = `${API_CONSTANTS.gatewayBaseUrl}/schedule/horarios`;
  private readonly monitorUrl = `${API_CONSTANTS.gatewayBaseUrl}/schedule/revision/asistencia/monitor`;

  constructor(private readonly http: HttpClient) {}

  registrarEmpleado(request: RegistrarEmpleadoRequest): Observable<EmpleadoResponse> {
    return this.http.post<EmpleadoResponse>(this.empleadosUrl, request);
  }

  getEmpleadoPorDocumento(documento: string): Observable<EmpleadoResponse> {
    return this.http.get<EmpleadoResponse>(`${this.empleadosUrl}/${documento}/numero-documento`);
  }

  actualizarDatosPersonales(
    empleadoId: number,
    request: ActualizarDatosPersonalesRequest
  ): Observable<EmpleadoResponse> {
    return this.http.patch<EmpleadoResponse>(`${this.empleadosUrl}/${empleadoId}/datos-personales`, request);
  }

  registrarContrato(
    empleadoId: number,
    request: RegistrarContratoRequest
  ): Observable<ContratoResponse> {
    return this.http.post<ContratoResponse>(`${this.contratosUrl}/${empleadoId}/registrar`, request);
  }

  getContratoVigente(empleadoId: number): Observable<ContratoResponse> {
    return this.http.get<ContratoResponse>(`${this.contratosUrl}/${empleadoId}/vigente`);
  }

  registrarHorario(request: RegistrarHorarioRequest): Observable<HorarioResponse> {
    return this.http.post<HorarioResponse>(this.horariosUrl, request);
  }

  getEmpleados(pageNumber = 0, pageSize = 8): Observable<PageResponse<EmpleadoResponse>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize)
      .set('sortBy', 'createdAt')
      .set('direction', 'desc');

    return this.http.get<PageResponse<EmpleadoResponse>>(this.empleadosUrl, { params });
  }

  listarEmpleadosLight(): Observable<EmpleadoRolResponse[]> {
    return this.http.get<EmpleadoRolResponse[]>(`${this.empleadosUrl}/light`);
  }

  getEstadosMonitorEmpleados(empleadoIds: number[], fecha: string): Observable<EstadoMonitorResponse[]> {
    return this.http.post<EstadoMonitorResponse[]>(`${this.monitorUrl}/estados`, { empleadoIds, fecha });
  }

  listarEmpresasContratistas(activo = true): Observable<EmpresaContratistaResponse[]> {
    const params = new HttpParams().set('activo', activo);
    return this.http.get<EmpresaContratistaResponse[]>(this.empresasContratistasUrl, { params });
  }
}
