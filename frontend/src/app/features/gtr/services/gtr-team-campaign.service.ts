import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import {
  DistribucionCampanasProveedorRequest,
  ProveedorCampanasEquipoResponse
} from '../../../shared/models/preventa/preventa.models';
import { EquipoOperativoResponse } from '../../preventa/services/preventa-lead.service';

@Injectable({ providedIn: 'root' })
export class GtrTeamCampaignService {
  private readonly http = inject(HttpClient);
  private readonly authEquiposUrl = `${API_CONSTANTS.gatewayBaseUrl}/auth/equipos`;
  private readonly leadEquiposUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads/equipos`;

  listarMisEquipos(): Observable<EquipoOperativoResponse[]> {
    return this.http.get<EquipoOperativoResponse[]>(`${this.authEquiposUrl}/mis-equipos`);
  }

  listarDistribucionesCampanas(): Observable<ProveedorCampanasEquipoResponse[]> {
    return this.http.get<ProveedorCampanasEquipoResponse[]>(`${this.leadEquiposUrl}/campanas/distribucion`);
  }

  actualizarDistribucionCampanas(
    idProveedor: number,
    request: DistribucionCampanasProveedorRequest
  ): Observable<ProveedorCampanasEquipoResponse> {
    return this.http.put<ProveedorCampanasEquipoResponse>(
      `${this.leadEquiposUrl}/campanas/proveedores/${idProveedor}/distribucion`,
      request
    );
  }
}
