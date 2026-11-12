import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';

export interface ColumnaInfo {
  key: string;
  label: string;
}

export interface ColumnaGrupo {
  grupo: string;
  columnas: ColumnaInfo[];
}

export interface BuscadorUniversalFilter {
  q?: string;
  etapa?: string;
  estado?: string;
  estadoClientePostventa?: string;
  idProveedor?: number | null;
  idProveedorOrigen?: number | null;
  idEquipo?: number | null;
  idAsesor?: number | null;
  idCampana?: number | null;
  idOrigen?: number | null;
  idPlan?: number | null;
  idZona?: number | null;
  fechaDesde?: string;
  fechaHasta?: string;
  anclaFecha?: string;
  codigosTipificacion?: string[];
  codigosSubtipificacion?: string[];
  columnas?: string[];
}

export interface BuscadorUniversalPage {
  content: Record<string, unknown>[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class BuscadorUniversalService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_CONSTANTS.gatewayBaseUrl}/leads/admin/buscador-universal`;

  listarColumnas(): Observable<ColumnaGrupo[]> {
    return this.http.get<ColumnaGrupo[]>(`${this.url}/columnas`);
  }

  buscar(filter: BuscadorUniversalFilter, page: number, size: number): Observable<BuscadorUniversalPage> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (filter.q) params = params.set('q', filter.q);
    if (filter.etapa) params = params.set('etapa', filter.etapa);
    if (filter.estado) params = params.set('estado', filter.estado);
    if (filter.estadoClientePostventa) params = params.set('estadoClientePostventa', filter.estadoClientePostventa);
    if (filter.idProveedor != null) params = params.set('idProveedor', filter.idProveedor);
    if (filter.idProveedorOrigen != null) params = params.set('idProveedorOrigen', filter.idProveedorOrigen);
    if (filter.idEquipo != null) params = params.set('idEquipo', filter.idEquipo);
    if (filter.idAsesor != null) params = params.set('idAsesor', filter.idAsesor);
    if (filter.idCampana != null) params = params.set('idCampana', filter.idCampana);
    if (filter.idOrigen != null) params = params.set('idOrigen', filter.idOrigen);
    if (filter.idPlan != null) params = params.set('idPlan', filter.idPlan);
    if (filter.idZona != null) params = params.set('idZona', filter.idZona);
    if (filter.fechaDesde) params = params.set('fechaDesde', filter.fechaDesde);
    if (filter.fechaHasta) params = params.set('fechaHasta', filter.fechaHasta);
    if (filter.anclaFecha) params = params.set('anclaFecha', filter.anclaFecha);

    if (filter.codigosTipificacion?.length) {
      for (const c of filter.codigosTipificacion) {
        params = params.append('codigosTipificacion', c);
      }
    }
    if (filter.codigosSubtipificacion?.length) {
      for (const c of filter.codigosSubtipificacion) {
        params = params.append('codigosSubtipificacion', c);
      }
    }
    if (filter.columnas?.length) {
      for (const c of filter.columnas) {
        params = params.append('columnas', c);
      }
    }

    return this.http.get<BuscadorUniversalPage>(this.url, { params });
  }
}
