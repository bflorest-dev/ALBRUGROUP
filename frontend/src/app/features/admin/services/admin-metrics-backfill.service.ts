import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';

/** Estado del backfill de métricas por etapa (LeadEtapaResumen). */
export interface MetricsBackfillEstado {
  enEjecucion: boolean;
  procesados: number;
  total: number;
  iniciadoEn: string | null;
  finalizadoEn: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminMetricsBackfillService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads/lead-etapa-resumen-backfill`;

  /** Arranca el backfill completo en segundo plano; devuelve el estado inicial. */
  iniciar(): Observable<MetricsBackfillEstado> {
    return this.http.post<MetricsBackfillEstado>(this.baseUrl, {});
  }

  /** Consulta el progreso del backfill (para refrescar mientras corre). */
  estado(): Observable<MetricsBackfillEstado> {
    return this.http.get<MetricsBackfillEstado>(`${this.baseUrl}/estado`);
  }
}
