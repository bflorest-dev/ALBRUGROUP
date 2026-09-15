import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../constants/api.constants';

export interface ProyeccionVentasResponse {
  instaladas: number;
  diasTranscurridos: number;
  diasTotales: number;
}

@Injectable({ providedIn: 'root' })
export class ProyeccionVentasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads/preventa/proyeccion-ventas`;

  obtenerProyeccionAsesor(): Observable<ProyeccionVentasResponse> {
    return this.http.get<ProyeccionVentasResponse>(`${this.baseUrl}/asesor`);
  }

  obtenerProyeccionEquipo(): Observable<ProyeccionVentasResponse> {
    return this.http.get<ProyeccionVentasResponse>(`${this.baseUrl}/equipo`);
  }
}
