import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { PageResponse } from '../../../shared/models/common/page-response';

export type MetricaPostventaCategoria = 'TOTAL' | 'PAGADOS' | 'IMPAGOS' | 'BAJAS';
export type MetricaPostventaModo = 'MENSUAL' | 'COHORTE';

export interface MetricaPostventaContexto {
  modo: MetricaPostventaModo;
  mesReferencia: string;
  proveedor: string;
  categoria: MetricaPostventaCategoria;
  cantidad: number;
  titulo: string;
  descripcion: string;
  mesCorteBase?: string;
  numeroCorte?: number;
  numeroRecibo?: number;
}

export interface DetalleMetricaPostventa {
  idLead: number;
  numeroLead: string | null;
  numeroDocumento: string | null;
  nombreCliente: string | null;
  fechaInstalacion: string | null;
  mesCorteBase: string;
  numeroCorte: number;
  numeroRecibo: number;
  estadoPeriodo: string;
  estadoPostventa: 'ACTIVO' | 'BAJA' | 'SUSPENDIDO';
  tipificacion: string | null;
  subtipificacion: string | null;
  ultimaGestion: string | null;
  asesorPostventa: string | null;
  proveedor: string;
  plan: string | null;
  cargoFijo: number | null;
  velocidadRegular: number | null;
  unidadVelocidad: string | null;
}

export interface DetalleMetricaPostventaQuery {
  contexto: MetricaPostventaContexto;
  pageNumber: number;
  pageSize: number;
  buscar?: string;
  estadoPostventa?: string;
  tipificacion?: string;
  subtipificacion?: string;
  sortBy: 'fechaInstalacion' | 'ultimaGestion';
  direction: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class AdminPostventaMetricDetailService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_CONSTANTS.gatewayBaseUrl}/leads/postventa/facturacion/detalle-metrica`;

  listar(query: DetalleMetricaPostventaQuery): Observable<PageResponse<DetalleMetricaPostventa>> {
    const c = query.contexto;
    let params = new HttpParams()
      .set('modo', c.modo)
      .set('mesReferencia', c.mesReferencia)
      .set('proveedor', c.proveedor)
      .set('categoria', c.categoria)
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize)
      .set('sortBy', query.sortBy)
      .set('direction', query.direction);

    if (c.mesCorteBase) params = params.set('mesCorteBase', c.mesCorteBase);
    if (c.numeroCorte != null) params = params.set('numeroCorte', c.numeroCorte);
    if (c.numeroRecibo != null) params = params.set('numeroRecibo', c.numeroRecibo);
    if (query.buscar?.trim()) params = params.set('buscar', query.buscar.trim());
    if (query.estadoPostventa) params = params.set('estadoPostventa', query.estadoPostventa);
    if (query.tipificacion?.trim()) params = params.set('tipificacion', query.tipificacion.trim());
    if (query.subtipificacion?.trim()) params = params.set('subtipificacion', query.subtipificacion.trim());

    return this.http.get<PageResponse<DetalleMetricaPostventa>>(this.url, { params });
  }
}
