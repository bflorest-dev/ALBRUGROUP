import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { LeadDetalleResponse } from '../../../shared/models/preventa/preventa.models';

export type TipoDocumento = string;
export type TipoReglaFacturacion = 'WIN' | 'CLARO' | 'PERSONALIZADA' | string;
export type EstadoPostventa = 'ACTIVO' | 'BAJA' | 'SUSPENDIDO' | string;
export type EstadoCumplimientoSemana =
  | 'CUMPLE'
  | 'NO_CUMPLE'
  | 'PENDIENTE_INSTALACION'
  | 'NO_EVALUABLE';

export interface LeadPreventaInstalacionRow {
  idLead: number;
  prefijo: string | null;
  lead: string | null;
  tipoDocumento: TipoDocumento | null;
  numeroDocumento: string | null;
  nombreCliente: string | null;
  departamento: string | null;
  idAsesorPreventa: number | null;
  nombreAsesorPreventa: string | null;
  idProveedor: number | null;
  proveedor: string | null;
  reglaSemanaProveedor: TipoReglaFacturacion | null;
  fechaPreventa: string | null;
  fechaInstalacion: string | null;
  estadoPostventa: EstadoPostventa | null;
  etapaActual: string | null;
  cumpleMismaSemana: boolean | null;
  estadoCumplimientoSemana: EstadoCumplimientoSemana;
  diasEntrePreventaEInstalacion: number | null;
  semanaPreventaInicio: string | null;
  semanaPreventaFin: string | null;
  semanaInstalacionInicio: string | null;
  semanaInstalacionFin: string | null;
}

export interface LeadPreventaInstalacionAsesor {
  idAsesor: number | null;
  nombreAsesor: string | null;
  totalPreventas: number;
  instalados: number;
  cumplenMismaSemana: number;
  noCumplenMismaSemana: number;
  pendientesInstalacion: number;
}

export interface LeadPreventaInstalacionTotales {
  totalPreventas: number;
  instalados: number;
  cumplenMismaSemana: number;
  noCumplenMismaSemana: number;
  pendientesInstalacion: number;
}

export interface LeadPreventaInstalacionPage {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  content: LeadPreventaInstalacionRow[];
}

export interface LeadPreventaInstalacionReport {
  detalle: LeadPreventaInstalacionPage;
  porAsesor: LeadPreventaInstalacionAsesor[];
  totales: LeadPreventaInstalacionTotales;
}

export interface LeadPreventaInstalacionQuery {
  fechaPreventaDesde: string;
  fechaPreventaHasta: string;
  fechaInstalacionDesde: string;
  fechaInstalacionHasta: string;
  idProveedor: number | null;
  idAsesorPreventa: number | null;
  estadoPostventa: EstadoPostventa | null;
  sinEstadoPostventa: boolean;
  cumpleMismaSemana: boolean | null;
  estadoCumplimientoSemana: EstadoCumplimientoSemana | null;
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  direction: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class PreventaInstalacionService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_CONSTANTS.gatewayBaseUrl}/leads/venta/preventa-instalacion`;

  listar(query: LeadPreventaInstalacionQuery): Observable<LeadPreventaInstalacionReport> {
    let params = new HttpParams()
      .set('fechaPreventaDesde', query.fechaPreventaDesde)
      .set('fechaPreventaHasta', query.fechaPreventaHasta)
      .set('fechaInstalacionDesde', query.fechaInstalacionDesde)
      .set('fechaInstalacionHasta', query.fechaInstalacionHasta)
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize)
      .set('sortBy', query.sortBy)
      .set('direction', query.direction);

    if (query.idProveedor !== null) params = params.set('idProveedor', query.idProveedor);
    if (query.idAsesorPreventa !== null) params = params.set('idAsesorPreventa', query.idAsesorPreventa);
    if (query.estadoPostventa !== null) params = params.set('estadoPostventa', query.estadoPostventa);
    if (query.sinEstadoPostventa) params = params.set('sinEstadoPostventa', true);
    if (query.cumpleMismaSemana !== null) {
      params = params.set('cumpleMismaSemana', query.cumpleMismaSemana);
    }
    if (query.estadoCumplimientoSemana !== null) {
      params = params.set('estadoCumplimientoSemana', query.estadoCumplimientoSemana);
    }
    return this.http.get<LeadPreventaInstalacionReport>(this.url, { params });
  }

  obtenerDetalle(idLead: number): Observable<LeadDetalleResponse> {
    return this.http.get<LeadDetalleResponse>(`${API_CONSTANTS.gatewayBaseUrl}/leads/venta/preventa-instalacion/${idLead}/detalle`);
  }
}
