import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';

export interface MetricaDia {
  fecha: string;
  preventas: number;
  instaladas: number;
}

export interface MetricasEmpleadoResponse {
  dias: MetricaDia[];
}

@Injectable({ providedIn: 'root' })
export class PersonalMetricasService {
  private readonly http = inject(HttpClient);
  private readonly base = API_CONSTANTS.gatewayBaseUrl;

  getMetricas(idEmpleado: number, anio: number, mes: number): Observable<MetricasEmpleadoResponse> {
    const params = new HttpParams().set('anio', anio).set('mes', mes);
    return this.http.get<MetricasEmpleadoResponse>(
      `${this.base}/leads/metricas-empleado/${idEmpleado}`, { params }
    );
  }
}
