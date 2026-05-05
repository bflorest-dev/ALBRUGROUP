import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { PageResponse } from '../../../shared/models/common/page-response';
import { ContratoResponse } from '../../../shared/models/rrhh/contrato-response';
import { EmpleadoResponse } from '../../../shared/models/rrhh/empleado-response';
import { EmpresaContratistaResponse } from '../../../shared/models/rrhh/empresa-contratista-response';
import { RegistrarContratoRequest } from '../../../shared/models/rrhh/registrar-contrato-request';
import { RegistrarEmpleadoRequest } from '../../../shared/models/rrhh/registrar-empleado-request';

@Injectable({
  providedIn: 'root'
})
export class AdminRrhhService {
  private readonly empleadosUrl = `${API_CONSTANTS.gatewayBaseUrl}/rrhh/empleados`;
  private readonly contratosUrl = `${API_CONSTANTS.gatewayBaseUrl}/rrhh/contratos`;
  private readonly empresasContratistasUrl = `${API_CONSTANTS.gatewayBaseUrl}/rrhh/empresas-contratistas`;

  constructor(private readonly http: HttpClient) {}

  registrarEmpleado(request: RegistrarEmpleadoRequest): Observable<EmpleadoResponse> {
    return this.http.post<EmpleadoResponse>(this.empleadosUrl, request);
  }

  registrarContrato(
    empleadoId: number,
    request: RegistrarContratoRequest
  ): Observable<ContratoResponse> {
    return this.http.post<ContratoResponse>(`${this.contratosUrl}/${empleadoId}/registrar`, request);
  }

  getEmpleados(pageNumber = 0, pageSize = 8): Observable<PageResponse<EmpleadoResponse>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize)
      .set('sortBy', 'createdAt')
      .set('direction', 'desc');

    return this.http.get<PageResponse<EmpleadoResponse>>(this.empleadosUrl, { params });
  }

  listarEmpresasContratistas(activo = true): Observable<EmpresaContratistaResponse[]> {
    const params = new HttpParams().set('activo', activo);
    return this.http.get<EmpresaContratistaResponse[]>(this.empresasContratistasUrl, { params });
  }
}
