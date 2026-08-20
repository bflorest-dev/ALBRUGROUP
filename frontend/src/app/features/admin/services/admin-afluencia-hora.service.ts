import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';

export type AfluenciaModo = 'INGRESADOS' | 'GESTIONADOS';

export interface AfluenciaPorHoraCelda {
  idEquipo: number | null;
  idCampana: number | null;
  nombreCampana: string | null;
  hora: number;
  total: number;
  unicos: number;
}

@Injectable({ providedIn: 'root' })
export class AdminAfluenciaHoraService {
  private readonly http = inject(HttpClient);
  private readonly leadsUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads`;

  obtenerAfluenciaPorHora(
    modo: AfluenciaModo,
    desde?: string,
    hasta?: string
  ): Observable<AfluenciaPorHoraCelda[]> {
    let params = new HttpParams().set('modo', modo);
    if (desde) {
      params = params.set('desde', desde);
    }
    if (hasta) {
      params = params.set('hasta', hasta);
    }
    return this.http.get<AfluenciaPorHoraCelda[]>(
      `${this.leadsUrl}/eventos/metricas/afluencia-por-hora`,
      { params }
    );
  }
}
