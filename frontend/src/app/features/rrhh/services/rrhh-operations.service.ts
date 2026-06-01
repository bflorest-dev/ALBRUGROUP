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
import { PagoResponse } from '../../../shared/models/rrhh/pago-response';
import { RegistrarContratoRequest } from '../../../shared/models/rrhh/registrar-contrato-request';
import { RegistrarEmpleadoRequest } from '../../../shared/models/rrhh/registrar-empleado-request';
import { RegistrarPagoRequest } from '../../../shared/models/rrhh/registrar-pago-request';
import { ConsultaCumplimientoRequest } from '../../../shared/models/schedule/consulta-cumplimiento-request';
import { ConsultaMonitoreoRequest } from '../../../shared/models/schedule/consulta-monitoreo-request';
import {
  CumplimientoDetalleResponse,
  CumplimientoResumenResponse,
  EstadoMonitorResponse
} from '../../../shared/models/schedule/cumplimiento-response';
import { ExcepcionHorarioResponse } from '../../../shared/models/schedule/excepcion-horario-response';
import { FinalizarHorarioRequest } from '../../../shared/models/schedule/finalizar-horario-request';
import { HorarioResponse } from '../../../shared/models/schedule/horario-response';
import { ReemplazarHorarioRequest } from '../../../shared/models/schedule/reemplazar-horario-request';
import { RegistrarExcepcionHorarioRequest } from '../../../shared/models/schedule/registrar-excepcion-horario-request';
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
  private readonly pagosUrl = `${this.rrhhUrl}/pagos`;
  private readonly empresasContratistasUrl = `${this.rrhhUrl}/empresas-contratistas`;
  private readonly horariosUrl = `${API_CONSTANTS.gatewayBaseUrl}/schedule/horarios`;
  private readonly revisionAsistenciaUrl = `${API_CONSTANTS.gatewayBaseUrl}/schedule/revision/asistencia`;

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

  darDeBaja(empleadoId: number): Observable<EmpleadoResponse> {
    return this.http.post<EmpleadoResponse>(`${this.empleadosUrl}/${empleadoId}/baja`, {});
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

  reemplazarHorario(
    idHorario: number,
    request: ReemplazarHorarioRequest
  ): Observable<HorarioResponse> {
    return this.http.put<HorarioResponse>(`${this.horariosUrl}/${idHorario}`, request);
  }

  finalizarHorario(
    idHorario: number,
    request: FinalizarHorarioRequest
  ): Observable<HorarioResponse> {
    return this.http.patch<HorarioResponse>(`${this.horariosUrl}/${idHorario}/finalizar`, request);
  }

  registrarExcepcion(
    idHorario: number,
    request: RegistrarExcepcionHorarioRequest
  ): Observable<ExcepcionHorarioResponse> {
    return this.http.post<ExcepcionHorarioResponse>(
      `${this.horariosUrl}/${idHorario}/excepciones`,
      request
    );
  }

  actualizarExcepcion(
    idHorario: number,
    idExcepcion: number,
    request: RegistrarExcepcionHorarioRequest
  ): Observable<ExcepcionHorarioResponse> {
    return this.http.put<ExcepcionHorarioResponse>(
      `${this.horariosUrl}/${idHorario}/excepciones/${idExcepcion}`,
      request
    );
  }

  eliminarExcepcion(idHorario: number, idExcepcion: number): Observable<void> {
    return this.http.delete<void>(`${this.horariosUrl}/${idHorario}/excepciones/${idExcepcion}`);
  }

  obtenerHorarioVigente(empleadoId: number, fecha?: string | null): Observable<HorarioResponse> {
    let params = new HttpParams();

    if (fecha) {
      params = params.set('fecha', fecha);
    }

    return this.http.get<HorarioResponse>(`${this.horariosUrl}/empleados/${empleadoId}/vigente`, {
      params
    });
  }

  listarHistoricoHorarios(
    empleadoId: number,
    pageNumber = 0,
    pageSize = 8
  ): Observable<PageResponse<HorarioResponse>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize)
      .set('sortBy', 'fechaInicio')
      .set('direction', 'desc');

    return this.http.get<PageResponse<HorarioResponse>>(
      `${this.horariosUrl}/empleados/${empleadoId}/historico`,
      { params }
    );
  }

  registrarPago(contratoId: number, request: RegistrarPagoRequest): Observable<PagoResponse> {
    return this.http.post<PagoResponse>(`${this.pagosUrl}/${contratoId}/pagar-contrato`, request);
  }

  listarPagos(
    filters: {
      contrato: number | null;
      empleado: number | null;
      desde: string | null;
      hasta: string | null;
    },
    pageNumber = 0,
    pageSize = 8
  ): Observable<PageResponse<PagoResponse>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize)
      .set('sortBy', 'createdAt')
      .set('direction', 'desc');

    if (filters.contrato) {
      params = params.set('contrato', filters.contrato);
    }

    if (filters.empleado) {
      params = params.set('empleado', filters.empleado);
    }

    if (filters.desde) {
      params = params.set('desde', filters.desde);
    }

    if (filters.hasta) {
      params = params.set('hasta', filters.hasta);
    }

    return this.http.get<PageResponse<PagoResponse>>(this.pagosUrl, { params });
  }

  consultarCumplimientoResumen(
    request: ConsultaCumplimientoRequest
  ): Observable<CumplimientoResumenResponse> {
    return this.http.post<CumplimientoResumenResponse>(
      `${this.revisionAsistenciaUrl}/cumplimiento/resumen`,
      request
    );
  }

  consultarCumplimientoDetalle(
    request: ConsultaCumplimientoRequest
  ): Observable<CumplimientoDetalleResponse> {
    return this.http.post<CumplimientoDetalleResponse>(
      `${this.revisionAsistenciaUrl}/cumplimiento/detalle`,
      request
    );
  }

  consultarMonitorEstados(request: ConsultaMonitoreoRequest): Observable<EstadoMonitorResponse[]> {
    return this.http.post<EstadoMonitorResponse[]>(
      `${this.revisionAsistenciaUrl}/monitor/estados`,
      request
    );
  }
}
