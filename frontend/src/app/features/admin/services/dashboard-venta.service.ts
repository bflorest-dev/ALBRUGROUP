import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';

export interface ProveedorRef {
  id: number;
  nombre: string;
}

/** Absolutos del universo VENTA del período (el frontend deriva las 6 conversiones). */
export interface DashboardVentaContadores {
  preventasCompletas: number;
  ventasRegistradas: number;
  ventasInstaladas: number;
  ventasRechazadas: number;
  ventasProgramadasActual: number;
  programadasTotal: number;
  programadasInstaladas: number;
  programadasRechazadas: number;
}

/** Universo por última tipificación (código null = SIN INGRESAR). */
export interface DashboardVentaEstadoLead {
  codigo: string | null;
  cantidad: number;
}

export interface DashboardVentaZona {
  registradas: number;
  instaladas: number;
  registradasEInstaladas: number;
  cfTotal: number;
  cfPromedio: number;
}

export interface DashboardVentaZonaSinUbigeo {
  registradas: number;
}

export interface DashboardVentaZonas {
  lima: DashboardVentaZona;
  provincia: DashboardVentaZona;
  sinUbigeo: DashboardVentaZonaSinUbigeo;
}

export interface DashboardVentaSubtip {
  codigo: string | null;
  cantidad: number;
}

export interface DashboardVentaProgramacion {
  total: number;
  porSubtipificacion: DashboardVentaSubtip[];
}

export interface DashboardVentaRankingAsesor {
  idAsesor: number;
  nombre: string | null;
  registradas: number;
  instaladas: number;
  registradasLima: number;
  instaladasLima: number;
  registradasProvincia: number;
  instaladasProvincia: number;
}

export interface DashboardVentaResponse {
  proveedor: ProveedorRef;
  periodo: { desde: string; hasta: string };
  contadores: DashboardVentaContadores;
  estadoLeads: DashboardVentaEstadoLead[];
  zonas: DashboardVentaZonas;
  programacionActual: DashboardVentaProgramacion;
  ranking: DashboardVentaRankingAsesor[];
}

export interface DashboardVentaTramo {
  codigo: string; // TRAMO_1 | TRAMO_2 | TRAMO_3 | OTROS
  desde: string | null;
  hasta: string | null;
  hoy: number;
  manana: number;
  pasado: number;
}

export interface DashboardVentaTramosResponse {
  proveedor: ProveedorRef;
  hoy: string;
  manana: string;
  pasado: string;
  tramos: DashboardVentaTramo[];
}

/** DASHBOARD de la etapa VENTA. Todo se filtra por proveedor; los % los calcula el frontend. */
@Injectable({ providedIn: 'root' })
export class DashboardVentaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads/venta/dashboard`;

  obtenerProveedores(): Observable<ProveedorRef[]> {
    return this.http.get<ProveedorRef[]>(`${this.baseUrl}/proveedores`);
  }

  obtenerDashboard(idProveedor: number, desde?: string, hasta?: string): Observable<DashboardVentaResponse> {
    let params = new HttpParams().set('idProveedor', idProveedor);
    if (desde) {
      params = params.set('desde', desde);
    }
    if (hasta) {
      params = params.set('hasta', hasta);
    }
    return this.http.get<DashboardVentaResponse>(this.baseUrl, { params });
  }

  obtenerTramos(idProveedor: number): Observable<DashboardVentaTramosResponse> {
    const params = new HttpParams().set('idProveedor', idProveedor);
    return this.http.get<DashboardVentaTramosResponse>(`${this.baseUrl}/programados-tramos`, { params });
  }
}
