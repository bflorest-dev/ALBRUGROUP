import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';

export interface GestionCohorteFila {
  mesCorteBase: string;
  numeroCorteBase: number;
  numeroFactura: number;
  fechaVencimiento: string;
  total: number;
  pagadoCliente: number;
  pagadoEmpresa: number;
  impagos: number;
  bajas: number;
}

export interface VentanaDecisionPostventa {
  fechaVencimientoObjetivo: string;
  fechaLimite: string;
  vencimientoOcurrido: boolean;
  filas: GestionCohorteFila[];
}

export interface GestionCohortePostventaResponse {
  mesCohorte: string;
  ultimaMesCohorte: string | null;
  fechaOperacion: string;
  proveedor: string;
  filas: GestionCohorteFila[];
  ventanaDecision: VentanaDecisionPostventa;
}

@Injectable({ providedIn: 'root' })
export class AdminGestionCohortePostventaService {
  private readonly http = inject(HttpClient);
  private readonly leadsUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads`;

  obtenerGestionPorCohorte(
    mesCohorte?: string,
    proveedor = 'WIN'
  ): Observable<GestionCohortePostventaResponse> {
    let params = new HttpParams().set('proveedor', proveedor);
    if (mesCohorte) {
      params = params.set('mesCohorte', mesCohorte);
    }
    return this.http.get<GestionCohortePostventaResponse>(
      `${this.leadsUrl}/postventa/facturacion/gestion-por-cohorte`,
      { params }
    );
  }
}
