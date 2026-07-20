import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { GestionCampoTipi } from './admin-gestion-campana.service';

/** Métricas del día de un equipo (idEquipo null = "Sin equipo"). C y E se derivan en el frontend. */
export interface LeadsDiariosMetricasEquipo {
  idEquipo: number | null;
  registros: number; // A
  leadsUnicos: number; // B
  leadsRepetidos: number; // D
  leadsTipificados: number; // F
  bloqueOrden1: number; // G orden 1-3
  bloqueOrden2: number; // G orden 4-6
  bloqueOrden3: number; // G orden 7-8
  leadsVentaCerrada: number; // H
}

@Injectable({ providedIn: 'root' })
export class AdminDailyMetricsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_CONSTANTS.gatewayBaseUrl}/leads/eventos/registros-diarios/metricas-por-equipo`;

  /**
   * Métricas desglosadas por equipo (scope del usuario). Cohorte = leads ingresados en el período.
   * Omitir `desde`/`hasta` deja que el backend use el día operativo de hoy (America/Lima).
   * `campo` elige el punto de tipificación con el que se cuentan tipificados, bloques y venta cerrada.
   */
  obtenerPorEquipo(
    desde?: string,
    hasta?: string,
    campo: GestionCampoTipi = 'ULTIMA'
  ): Observable<LeadsDiariosMetricasEquipo[]> {
    let params = new HttpParams().set('campo', campo);
    if (desde) {
      params = params.set('desde', desde);
    }
    if (hasta) {
      params = params.set('hasta', hasta);
    }
    return this.http.get<LeadsDiariosMetricasEquipo[]>(this.url, { params });
  }
}
