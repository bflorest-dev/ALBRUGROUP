import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { CampoTipificacion, Etapa } from '../../../shared/models/preventa/preventa.models';

export interface BaseLeadsExportFilter {
  etapa: Etapa;
  desde: string;
  hasta: string;
  campoTipificacion?: CampoTipificacion;
  idProveedorOrigen?: number | null;
  idProveedor?: number | null;
  codigosTipificacion?: string[];
  codigosSubtipificacion?: string[];
}

export interface BaseLeadPreviewResponse {
  prefijo: string;
  lead: string;
  usermeta: string;
  documento: string;
  direccion: string;
  nombre: string;
  etapa: string;
  codigoTipificacion: string;
  codigoSubtipificacion: string;
  nombreProveedor: string;
  fechaTipificacion: string;
}

export interface BaseLeadsCountResponse {
  totalLeads: number;
  suggestedName: string;
}

export interface BaseLeadsExportRequest {
  filter: BaseLeadsExportFilter;
  origenCodigo: string;
  maxLeadsPorArchivo: number;
}

export interface OrigenResponse {
  id: number;
  codigo: string;
  nombre: string;
  esOrganico: boolean;
  esCampana: boolean;
}

@Injectable({ providedIn: 'root' })
export class BaseLeadsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_CONSTANTS.gatewayBaseUrl}/leads/admin/base-leads`;
  private readonly origenesUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads/origenes`;

  preview(filter: BaseLeadsExportFilter, page: number, size: number): Observable<{ content: BaseLeadPreviewResponse[]; totalElements: number }> {
    const params = this.buildFilterParams(filter)
      .set('page', page)
      .set('size', size);
    return this.http.get<{ content: BaseLeadPreviewResponse[]; totalElements: number }>(`${this.url}/preview`, { params });
  }

  count(filter: BaseLeadsExportFilter): Observable<BaseLeadsCountResponse> {
    const params = this.buildFilterParams(filter);
    return this.http.get<BaseLeadsCountResponse>(`${this.url}/count`, { params });
  }

  exportZip(request: BaseLeadsExportRequest): Observable<Blob> {
    return this.http.post(`${this.url}/export`, request, { responseType: 'blob' });
  }

  listarOrigenes(): Observable<OrigenResponse[]> {
    return this.http.get<OrigenResponse[]>(this.origenesUrl);
  }

  private buildFilterParams(filter: BaseLeadsExportFilter): HttpParams {
    let params = new HttpParams()
      .set('etapa', filter.etapa)
      .set('desde', filter.desde)
      .set('hasta', filter.hasta);

    if (filter.campoTipificacion) {
      params = params.set('campoTipificacion', filter.campoTipificacion);
    }
    if (filter.idProveedorOrigen != null) {
      params = params.set('idProveedorOrigen', filter.idProveedorOrigen);
    }
    if (filter.idProveedor != null) {
      params = params.set('idProveedor', filter.idProveedor);
    }
    if (filter.codigosTipificacion?.length) {
      for (const codigo of filter.codigosTipificacion) {
        params = params.append('codigosTipificacion', codigo);
      }
    }
    if (filter.codigosSubtipificacion?.length) {
      for (const codigo of filter.codigosSubtipificacion) {
        params = params.append('codigosSubtipificacion', codigo);
      }
    }
    return params;
  }
}
