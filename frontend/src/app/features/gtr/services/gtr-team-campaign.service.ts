import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import {
  EquipoCampanaResponse,
  LeadGtrMetricasProveedorResponse
} from '../../../shared/models/preventa/preventa.models';
import { EquipoOperativoResponse } from '../../preventa/services/preventa-lead.service';

@Injectable({ providedIn: 'root' })
export class GtrTeamCampaignService {
  private readonly http = inject(HttpClient);
  private readonly authEquiposUrl = `${API_CONSTANTS.gatewayBaseUrl}/auth/equipos`;
  private readonly leadEquiposUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads/equipos`;
  private readonly metricasUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads/preventa/gtr/metricas/proveedores`;

  listarMisEquipos(): Observable<EquipoOperativoResponse[]> {
    return this.http.get<EquipoOperativoResponse[]>(`${this.authEquiposUrl}/mis-equipos`);
  }

  listarCampanasEquipo(idEquipo: number): Observable<EquipoCampanaResponse[]> {
    return this.http.get<EquipoCampanaResponse[]>(`${this.leadEquiposUrl}/${idEquipo}/campanas`);
  }

  asignarCampanasEquipo(idEquipo: number, campanaIds: number[]): Observable<EquipoCampanaResponse[]> {
    return this.http.put<EquipoCampanaResponse[]>(`${this.leadEquiposUrl}/${idEquipo}/campanas`, { campanaIds });
  }

  obtenerMetricasPorProveedor(fecha?: string | null): Observable<LeadGtrMetricasProveedorResponse[]> {
    let params = new HttpParams();
    if (fecha) {
      params = params.set('fecha', fecha);
    }
    return this.http.get<LeadGtrMetricasProveedorResponse[]>(this.metricasUrl, { params });
  }
}
