import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { CatalogoEstadoRequest, CatalogoRequest, CatalogoResponse } from '../../../shared/models/preventa/preventa.models';

@Injectable({ providedIn: 'root' })
export class AdminTipificacionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads/tipificaciones`;

  getCatalogo(etapa: string): Observable<CatalogoResponse> {
    return this.http.get<CatalogoResponse>(`${this.baseUrl}/${etapa}/catalogo`);
  }

  upsertCatalogo(request: CatalogoRequest): Observable<CatalogoResponse> {
    return this.http.put<CatalogoResponse>(`${this.baseUrl}/catalogo`, request);
  }

  actualizarEstadoCatalogo(request: CatalogoEstadoRequest): Observable<CatalogoResponse> {
    return this.http.patch<CatalogoResponse>(`${this.baseUrl}/catalogo/estado`, request);
  }
}
