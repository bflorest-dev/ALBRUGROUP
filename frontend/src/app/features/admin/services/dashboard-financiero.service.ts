import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';

export interface FinancieroProveedorRef {
  id: number;
  nombre: string;
}

export interface ZonaResumen {
  idZona: number;
  nombreZona: string;
  ingresadas: number;
  instaladas: number;
  cfInstaladas: number;
}

export interface ResumenFinancieroDia {
  fecha: string;
  ctaBancaria: number;
  ctaPublicitaria: number;
  calculadoAt: string;
  zonas: ZonaResumen[];
}

@Injectable({ providedIn: 'root' })
export class DashboardFinancieroService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads/financiero`;

  obtenerProveedores(): Observable<FinancieroProveedorRef[]> {
    return this.http.get<FinancieroProveedorRef[]>(`${this.baseUrl}/dashboard/proveedores`);
  }

  consultar(idProveedor: number, desde: string, hasta: string): Observable<ResumenFinancieroDia[]> {
    const params = new HttpParams()
      .set('idProveedor', idProveedor)
      .set('desde', desde)
      .set('hasta', hasta);
    return this.http.get<ResumenFinancieroDia[]>(`${this.baseUrl}/resumen-diario`, { params });
  }

  recalcular(idProveedor: number, desde: string, hasta: string): Observable<ResumenFinancieroDia[]> {
    const params = new HttpParams()
      .set('idProveedor', idProveedor)
      .set('desde', desde)
      .set('hasta', hasta);
    return this.http.post<ResumenFinancieroDia[]>(`${this.baseUrl}/resumen-diario/recalcular`, null, { params });
  }
}
