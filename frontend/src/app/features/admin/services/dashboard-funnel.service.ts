import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';

export interface ProveedorRef {
  id: number;
  nombre: string;
}

export interface FunnelContadores {
  leadsBrutos: number;
  sinContacto: number;
  noCalifica: number;
  sinCobertura: number;
  noDesea: number;
  servicioActivo: number;
  preventa: number;
  instaladas: number;
  inversion: number;
}

export interface DashboardFunnelResponse {
  proveedor: ProveedorRef;
  periodo: { desde: string; hasta: string };
  contadores: FunnelContadores;
}

@Injectable({ providedIn: 'root' })
export class DashboardFunnelService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads/funnel/dashboard`;

  obtenerProveedores(): Observable<ProveedorRef[]> {
    return this.http.get<ProveedorRef[]>(`${this.baseUrl}/proveedores`);
  }

  obtenerDashboard(idProveedor: number, desde?: string, hasta?: string): Observable<DashboardFunnelResponse> {
    let params = new HttpParams().set('idProveedor', idProveedor);
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<DashboardFunnelResponse>(this.baseUrl, { params });
  }
}
