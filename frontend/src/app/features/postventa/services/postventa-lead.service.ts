import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import {
  CatalogoResponse,
  EventoResponse,
  LeadDetalleResponse,
  LeadPage,
  PageQuery
} from '../../../shared/models/preventa/preventa.models';

export type EstadoClientePostventa = 'ACTIVO' | 'SUSPENDIDO' | 'BAJA';
export type EstadoCredencialesPostventa = 'ENTREGADAS' | 'NO_REQUIERE' | 'PENDIENTES';
export type EstadoPagoPeriodoPostventa = 'POR_EMITIR' | 'PENDIENTE_PAGO' | 'VENCIDA' | 'PAGADA';
export type EstadoServicioPostventa = 'SIN_CALIFICAR' | 'INSATISFECHO' | 'SATISFECHO' | 'MUY_SATISFECHO';
export type EstadoPeriodoFacturacionPostventa =
  | 'ABIERTO'
  | 'CERRADO_PAGO_CLIENTE'
  | 'CERRADO_PAGO_EMPRESA'
  | 'CERRADO_BAJA'
  | 'CERRADO_BAJA_ADEUDO';
export type AportantePago = 'CLIENTE' | 'EMPRESA';
export type EstadoPagoPostventa = 'COMPROMETIDO' | 'PAGADO_CLIENTE' | 'PAGADO_EMPRESA';
export type CondicionPagoPostventa = 'NORMAL' | 'REINTEGRO' | 'CASHBACK_ASESOR_VENTAS' | 'CASHBACK_POSTVENTA';
export type TipoEncuestaPostventa = 'SATISFACCION_ASESOR' | 'SATISFACCION_SERVICIO';
export type TipoContactoEncuesta = 'LLAMADA' | 'CHAT';
export type TipoDispositivo = 'TV' | 'TV_BOX' | 'CELULAR' | 'TABLET' | 'LAPTOP';

export interface LeadPostventaBandejaResponse {
  idLead: number;
  fechaInstalacion?: string | null;
  tipoDocumento?: string | null;
  numeroDocumento?: string | null;
  lead?: string | null;
  nombreCliente?: string | null;
  telefonoRegistro?: string | null;
  proveedor?: string | null;
  plan?: string | null;
  mesCorteBase?: string | null;
  numeroCorteBase?: number | null;
  corteCorregido?: boolean | null;
  fechaCorreccionCorte?: string | null;
  idPlataformaDigitalOfrecida?: number | null;
  plataformaDigitalOfrecida?: string | null;
  estadoCliente?: EstadoClientePostventa | string | null;
  estadoCredenciales?: EstadoCredencialesPostventa | string | null;
  estadoPago?: EstadoPagoPeriodoPostventa | string | null;
  estadoServicio?: EstadoServicioPostventa | string | null;
  estadoPlataformaDigital?: string | null;
  ultimoGestor?: string | null;
  ultimaGestion?: string | null;
}

export interface PostventaBandejaQuery extends PageQuery {
  mesCorteBase?: string | null;
  numeroCorteBase?: number | null;
}

export interface PlataformaDigitalResponse {
  id: number;
  nombre?: string | null;
  activo?: boolean;
}

export interface PaquetePlataformaResponse {
  id: number;
  nombre?: string | null;
  idPlataforma: number;
  plataforma?: string | null;
  cantidadMeses?: number | null;
  cantidadUsuarios?: number | null;
  consumeCreditos?: boolean | null;
  cantidadCreditosConsumidos?: number | null;
  precioVenta?: number | null;
}

export interface CredencialPlataformaResponse {
  id: number;
  idPaquete: number;
  paquete?: string | null;
  idPlataforma?: number | null;
  plataforma?: string | null;
  usuario?: string | null;
  password?: string | null;
  fechaCreacion?: string | null;
  fechaExpiracion?: string | null;
  estado?: string | null;
  cuposTotales?: number | null;
  cuposUsados?: number | null;
  cuposDisponibles?: number | null;
  observacion?: string | null;
}

export interface EntregaCredencialDispositivoRequest {
  tipoDispositivo?: TipoDispositivo | string | null;
  idMarcaDispositivo?: number | null;
  marcaDispositivo?: string | null;
  descripcion?: string | null;
}

export interface EntregaCredencialPlataformaRequest {
  idCredencial: number;
  cantidadUsuariosAsignados: number;
  esObsequio?: boolean | null;
  montoVenta?: number | null;
  fechaEntrega?: string | null;
  fechaInicioAcceso?: string | null;
  observacion?: string | null;
  dispositivos?: EntregaCredencialDispositivoRequest[] | null;
}

export interface EntregaCredencialPlataformaResponse {
  id: number;
  idLead: number;
  idCredencial: number;
  plataforma?: string | null;
  paquete?: string | null;
  usuario?: string | null;
  cantidadUsuariosAsignados?: number | null;
  esObsequio?: boolean | null;
  montoVenta?: number | null;
  fechaEntrega?: string | null;
  fechaInicioAcceso?: string | null;
  fechaFinAcceso?: string | null;
  estado?: string | null;
  nombreAsesorEntrega?: string | null;
  observacion?: string | null;
  dispositivos?: EntregaCredencialDispositivoRequest[] | null;
}

export interface PeriodoFacturacionPostventaResponse {
  id: number;
  idLead: number;
  numeroPeriodo?: number | null;
  fechaInicioPeriodo?: string | null;
  fechaFinPeriodo?: string | null;
  fechaCorteEstimada?: string | null;
  fechaEmisionEstimada?: string | null;
  fechaEmisionConfirmada?: string | null;
  fechaVencimientoEstimado?: string | null;
  fechaVencimientoConfirmado?: string | null;
  montoEsperado?: number | null;
  montoProrrateo?: number | null;
  montoFacturado?: number | null;
  estado?: EstadoPeriodoFacturacionPostventa | string | null;
  observacion?: string | null;
}

export interface PeriodoFacturacionFacturaRequest {
  fechaEmisionConfirmada?: string | null;
  fechaVencimientoConfirmado?: string | null;
  montoFacturado?: number | null;
  observacion?: string | null;
}

export interface CerrarPeriodoFacturacionRequest {
  estado: EstadoPeriodoFacturacionPostventa;
  crearSiguientePeriodo?: boolean | null;
  observacion?: string | null;
}

export interface EncuestaPostventaRequest {
  idPeriodoFacturacion?: number | null;
  tipoEncuesta?: TipoEncuestaPostventa | string | null;
  tipoContacto?: TipoContactoEncuesta | string | null;
  calificacion?: number | null;
  comentario?: string | null;
}

export interface EncuestaPostventaResponse extends EncuestaPostventaRequest {
  id: number;
  estado?: string | null;
  status?: string | null;
  prioridad?: string | null;
  numeroEncuesta?: number | null;
  nombreAsesorEncuesta?: string | null;
  createdAt?: string | null;
}

/** Resumen de satisfaccion del lead (promedio + status), calculado por el backend. */
export interface SatisfaccionPostventaResponse {
  idLead?: number | null;
  promedioSatisfaccion?: number | null;
  statusSatisfaccion?: string | null;
}

export interface PagoPostventaRequest {
  idPeriodoFacturacion?: number | null;
  aportante?: AportantePago | string | null;
  condicion?: CondicionPagoPostventa | string | null;
  monto: number;
  fechaPago?: string | null;
  fechaCompromisoPago?: string | null;
  numeroOperacion?: string | null;
  observacion?: string | null;
}

export interface PagoPostventaResponse extends PagoPostventaRequest {
  id: number;
  idLead: number;
  estado?: EstadoPagoPostventa | string | null;
  createdAt?: string | null;
}

export interface LeadTipificacionPostventaRequest {
  codigoTipificacion: string;
  codigoSubtipificacion: string;
  comentario?: string | null;
}

export interface LeadTomaPostventaRequest {
  confirmarReasignacion?: boolean;
}

/** Detalle del 409 cuando el lead ya lo tiene otro asesor en gestion (mismo shape que VENTA/BACKOFFICE). */
export interface PostventaAsignacionConflictDetails {
  tipo?: string | null;
  idAsesorActual?: number | null;
  nombreAsesorActual?: string | null;
  requiereConfirmarReasignacion?: boolean | null;
  requiereConfirmarLeadEnGestion?: boolean | null;
}

@Injectable({ providedIn: 'root' })
export class PostventaLeadService {
  private readonly http = inject(HttpClient);
  private readonly leadUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads`;

  listarBandeja(query: PostventaBandejaQuery): Observable<LeadPage<LeadPostventaBandejaResponse>> {
    return this.http.get<LeadPage<LeadPostventaBandejaResponse>>(`${this.leadUrl}/postventa/bandeja`, {
      params: this.pageParams(query)
    });
  }

  tomarLead(idLead: number, request: LeadTomaPostventaRequest = {}): Observable<void> {
    return this.http.patch<void>(`${this.leadUrl}/postventa/${idLead}/asignacion`, request);
  }

  obtenerDetalle(idLead: number): Observable<LeadDetalleResponse> {
    return this.http.get<LeadDetalleResponse>(`${this.leadUrl}/postventa/${idLead}/detalle-asesor`);
  }

  listarEventos(idLead: number, query: PageQuery): Observable<LeadPage<EventoResponse>> {
    return this.http.get<LeadPage<EventoResponse>>(`${this.leadUrl}/postventa/${idLead}/eventos`, {
      params: this.pageParams(query)
    });
  }

  getCatalogoTipificaciones(idLead: number): Observable<CatalogoResponse> {
    return this.http.get<CatalogoResponse>(`${this.leadUrl}/tipificaciones/lead/${idLead}/POSTVENTA/catalogo`);
  }

  registrarContacto(idLead: number): Observable<void> {
    return this.http.patch<void>(`${this.leadUrl}/postventa/${idLead}/contacto`, {});
  }

  tipificarLead(idLead: number, request: LeadTipificacionPostventaRequest): Observable<void> {
    return this.http.patch<void>(`${this.leadUrl}/postventa/${idLead}/tipificacion`, request);
  }

  listarPlataformasDigitales(): Observable<PlataformaDigitalResponse[]> {
    return this.http.get<PlataformaDigitalResponse[]>(`${this.leadUrl}/postventa/plataformas-digitales/plataformas`);
  }

  listarPaquetesPlataforma(idPlataforma: number): Observable<PaquetePlataformaResponse[]> {
    return this.http.get<PaquetePlataformaResponse[]>(`${this.leadUrl}/postventa/plataformas-digitales/paquetes`, {
      params: new HttpParams().set('idPlataforma', idPlataforma)
    });
  }

  listarCredencialesPlataformaDisponibles(idPaquete: number): Observable<CredencialPlataformaResponse[]> {
    return this.http.get<CredencialPlataformaResponse[]>(`${this.leadUrl}/postventa/plataformas-digitales/credenciales`, {
      params: new HttpParams().set('idPaquete', idPaquete)
    });
  }

  listarMarcasDispositivo(): Observable<PlataformaDigitalResponse[]> {
    return this.http.get<PlataformaDigitalResponse[]>(`${this.leadUrl}/postventa/plataformas-digitales/marcas-dispositivo`);
  }

  listarEntregas(idLead: number): Observable<EntregaCredencialPlataformaResponse[]> {
    return this.http.get<EntregaCredencialPlataformaResponse[]>(`${this.leadUrl}/postventa/plataformas-digitales/leads/${idLead}/entregas`);
  }

  entregarCredencial(idLead: number, request: EntregaCredencialPlataformaRequest): Observable<EntregaCredencialPlataformaResponse> {
    return this.http.post<EntregaCredencialPlataformaResponse>(
      `${this.leadUrl}/postventa/plataformas-digitales/leads/${idLead}/entregas`,
      request
    );
  }

  listarPeriodos(idLead: number): Observable<PeriodoFacturacionPostventaResponse[]> {
    return this.http.get<PeriodoFacturacionPostventaResponse[]>(`${this.leadUrl}/postventa/leads/${idLead}/periodos`);
  }

  confirmarFactura(idPeriodo: number, request: PeriodoFacturacionFacturaRequest): Observable<PeriodoFacturacionPostventaResponse> {
    return this.http.patch<PeriodoFacturacionPostventaResponse>(`${this.leadUrl}/postventa/periodos/${idPeriodo}/factura`, request);
  }

  cerrarPeriodo(idPeriodo: number, request: CerrarPeriodoFacturacionRequest): Observable<PeriodoFacturacionPostventaResponse> {
    return this.http.patch<PeriodoFacturacionPostventaResponse>(`${this.leadUrl}/postventa/periodos/${idPeriodo}/cierre`, request);
  }

  listarEncuestas(idLead: number, query: PageQuery): Observable<LeadPage<EncuestaPostventaResponse>> {
    return this.http.get<LeadPage<EncuestaPostventaResponse>>(`${this.leadUrl}/postventa/leads/${idLead}/encuestas`, {
      params: this.pageParams(query)
    });
  }

  registrarEncuesta(idLead: number, request: EncuestaPostventaRequest): Observable<EncuestaPostventaResponse> {
    return this.http.post<EncuestaPostventaResponse>(`${this.leadUrl}/postventa/leads/${idLead}/encuestas`, request);
  }

  obtenerResumenEncuestas(idLead: number): Observable<SatisfaccionPostventaResponse> {
    return this.http.get<SatisfaccionPostventaResponse>(`${this.leadUrl}/postventa/leads/${idLead}/encuestas/resumen`);
  }

  listarPagos(idLead: number, query: PageQuery): Observable<LeadPage<PagoPostventaResponse>> {
    return this.http.get<LeadPage<PagoPostventaResponse>>(`${this.leadUrl}/postventa/leads/${idLead}/pagos`, {
      params: this.pageParams(query)
    });
  }

  registrarPago(idLead: number, request: PagoPostventaRequest): Observable<PagoPostventaResponse> {
    return this.http.post<PagoPostventaResponse>(`${this.leadUrl}/postventa/leads/${idLead}/pagos`, request);
  }

  private pageParams(query: PostventaBandejaQuery): HttpParams {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize)
      .set('sortBy', query.sortBy)
      .set('direction', query.direction);
    if (query.mesCorteBase) {
      params = params.set('mesCorteBase', query.mesCorteBase);
    }
    if (query.numeroCorteBase) {
      params = params.set('numeroCorteBase', query.numeroCorteBase);
    }
    return params;
  }
}
