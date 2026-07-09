import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';

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

  /** Métricas del día desglosadas por equipo (día completo con el scope del usuario). */
  obtenerPorEquipo(fecha?: string): Observable<LeadsDiariosMetricasEquipo[]> {
    let params = new HttpParams();
    if (fecha) {
      params = params.set('fecha', fecha);
    }
    return this.http.get<LeadsDiariosMetricasEquipo[]>(this.url, { params });
  }
}
