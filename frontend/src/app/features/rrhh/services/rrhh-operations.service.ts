import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { PageResponse } from '../../../shared/models/common/page-response';
import { CerrarContratoRequest } from '../../../shared/models/rrhh/cerrar-contrato-request';
import { ContratoResponse } from '../../../shared/models/rrhh/contrato-response';
import { DatosContactoCorporativoRequest } from '../../../shared/models/rrhh/datos-contacto-corporativo-request';
import { DatosContactoUbicacionRequest } from '../../../shared/models/rrhh/datos-contacto-ubicacion-request';
import { DatosFinancierosRequest } from '../../../shared/models/rrhh/datos-financieros-request';
import { DatosPersonalesRequest } from '../../../shared/models/rrhh/datos-personales-request';
import { EmpleadoResponse } from '../../../shared/models/rrhh/empleado-response';
import { EmpresaContratistaResponse } from '../../../shared/models/rrhh/empresa-contratista-response';
import { EventoEmpleadoResponse } from '../../../shared/models/rrhh/evento-empleado-response';
import { RegistrarContratoRequest } from '../../../shared/models/rrhh/registrar-contrato-request';
import { RegistrarEmpleadoRequest } from '../../../shared/models/rrhh/registrar-empleado-request';
import { HorarioResponse } from '../../../shared/models/schedule/horario-response';
import { RegistrarHorarioRequest } from '../../../shared/models/schedule/registrar-horario-request';

export type EmpleadoFilters = {
  q: string | null;
  dni: string | null;
  celular: string | null;
  distrito: string | null;
  banco: string | null;
  origen: string | null;
  estado: string | null;
  idEmpresaContratista: number | null;
};

@Injectable({
  providedIn: 'root'
})
export class RrhhOperationsService {
  private readonly rrhhUrl = `${API_CONSTANTS.gatewayBaseUrl}/rrhh`;
  private readonly empleadosUrl = `${this.rrhhUrl}/empleados`;
  private readonly contratosUrl = `${this.rrhhUrl}/contratos`;
  private readonly eventosUrl = `${this.rrhhUrl}/eventos`;
  private readonly empresasContratistasUrl = `${this.rrhhUrl}/empresas-contratistas`;
  private readonly horariosUrl = `${API_CONSTANTS.gatewayBaseUrl}/schedule/horarios`;

  constructor(private readonly http: HttpClient) {}

  listarEmpresasContratistas(activo = true): Observable<EmpresaContratistaResponse[]> {
    const params = new HttpParams().set('activo', activo);
    return this.http.get<EmpresaContratistaResponse[]>(this.empresasContratistasUrl, { params });
  }

  registrarEmpleado(request: RegistrarEmpleadoRequest): Observable<EmpleadoResponse> {
    return this.http.post<EmpleadoResponse>(this.empleadosUrl, request);
  }

  actualizarDatosPersonales(
    empleadoId: number,
    request: DatosPersonalesRequest
  ): Observable<EmpleadoResponse> {
    return this.http.patch<EmpleadoResponse>(
      `${this.empleadosUrl}/${empleadoId}/datos-personales`,
      request
    );
  }

  actualizarDatosContactoUbicacion(
    empleadoId: number,
    request: DatosContactoUbicacionRequest
  ): Observable<EmpleadoResponse> {
    return this.http.patch<EmpleadoResponse>(
      `${this.empleadosUrl}/${empleadoId}/datos-contacto-ubicacion`,
      request
    );
  }

  actualizarDatosFinancieros(
    empleadoId: number,
    request: DatosFinancierosRequest
  ): Observable<EmpleadoResponse> {
    return this.http.patch<EmpleadoResponse>(
      `${this.empleadosUrl}/${empleadoId}/datos-financieros`,
      request
    );
  }

  actualizarDatosCorporativos(
    empleadoId: number,
    request: DatosContactoCorporativoRequest
  ): Observable<EmpleadoResponse> {
    return this.http.patch<EmpleadoResponse>(
      `${this.empleadosUrl}/${empleadoId}/datos-corporativos`,
      request
    );
  }

  marcarListaNegra(empleadoId: number): Observable<EmpleadoResponse> {
    return this.http.patch<EmpleadoResponse>(`${this.empleadosUrl}/${empleadoId}/lista-negra`, {});
  }

  listarEmpleados(
    filters: EmpleadoFilters,
    pageNumber = 0,
    pageSize = 8
  ): Observable<PageResponse<EmpleadoResponse>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize)
      .set('sortBy', 'createdAt')
      .set('direction', 'desc');

    if (filters.q) {
      params = params.set('q', filters.q);
    }

    if (filters.dni) {
      params = params.set('dni', filters.dni);
    }

    if (filters.celular) {
      params = params.set('celular', filters.celular);
    }

    if (filters.distrito) {
      params = params.set('distrito', filters.distrito);
    }

    if (filters.banco) {
      params = params.set('banco', filters.banco);
    }

    if (filters.origen) {
      params = params.set('origen', filters.origen);
    }

    if (filters.estado) {
      params = params.set('estado', filters.estado);
    }

    if (filters.idEmpresaContratista) {
      params = params.set('idEmpresaContratista', filters.idEmpresaContratista);
    }

    return this.http.get<PageResponse<EmpleadoResponse>>(this.empleadosUrl, { params });
  }

  buscarEmpleadoUniversal(
    dato: string,
    pageNumber = 0,
    pageSize = 8
  ): Observable<PageResponse<EmpleadoResponse>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize)
      .set('sortBy', 'createdAt')
      .set('direction', 'desc');

    return this.http.get<PageResponse<EmpleadoResponse>>(`${this.empleadosUrl}/${dato}/universal`, {
      params
    });
  }

  buscarEmpleadoPorDocumento(documento: string): Observable<EmpleadoResponse> {
    return this.http.get<EmpleadoResponse>(`${this.empleadosUrl}/${documento}/numero-documento`);
  }

  registrarContrato(
    empleadoId: number,
    request: RegistrarContratoRequest
  ): Observable<ContratoResponse> {
    return this.http.post<ContratoResponse>(`${this.contratosUrl}/${empleadoId}/registrar`, request);
  }

  listarHistoricoContratos(
    empleadoId: number,
    pageNumber = 0,
    pageSize = 8
  ): Observable<PageResponse<ContratoResponse>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize)
      .set('sortBy', 'fechaInicio')
      .set('direction', 'desc');

    return this.http.get<PageResponse<ContratoResponse>>(
      `${this.contratosUrl}/${empleadoId}/historico`,
      { params }
    );
  }

  obtenerContratoVigente(empleadoId: number): Observable<ContratoResponse> {
    return this.http.get<ContratoResponse>(`${this.contratosUrl}/${empleadoId}/vigente`);
  }

  finalizarContrato(
    empleadoId: number,
    request: CerrarContratoRequest
  ): Observable<ContratoResponse> {
    return this.http.patch<ContratoResponse>(
      `${this.contratosUrl}/${empleadoId}/cesar-contrato`,
      request
    );
  }

  listarEventosEmpleado(
    empleadoId: number,
    pageNumber = 0,
    pageSize = 8
  ): Observable<PageResponse<EventoEmpleadoResponse>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize)
      .set('sortBy', 'fechaEvento')
      .set('direction', 'desc');

    return this.http.get<PageResponse<EventoEmpleadoResponse>>(
      `${this.eventosUrl}/${empleadoId}/empleados`,
      { params }
    );
  }

  registrarHorario(request: RegistrarHorarioRequest): Observable<HorarioResponse> {
    return this.http.post<HorarioResponse>(this.horariosUrl, request);
  }
}
