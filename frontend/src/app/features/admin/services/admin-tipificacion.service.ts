import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import {
  CatalogoEstadoRequest,
  CatalogoRequest,
  CatalogoResponse,
  ClonarMatrizRequest,
  MatrizCatalogoRequest
} from '../../../shared/models/preventa/preventa.models';

export interface ProveedorCatalogoItem {
  id: number;
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class AdminTipificacionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads/tipificaciones`;
  private readonly proveedoresUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads/proveedores`;

  listarProveedores(): Observable<ProveedorCatalogoItem[]> {
    return this.http.get<ProveedorCatalogoItem[]>(this.proveedoresUrl, {
      params: new HttpParams().set('activo', true)
    });
  }

  getCatalogo(etapa: string, idProveedor: number, includeFlujos = true): Observable<CatalogoResponse> {
    const params = new HttpParams()
      .set('idProveedor', idProveedor)
      .set('includeFlujos', includeFlujos);
    return this.http.get<CatalogoResponse>(`${this.baseUrl}/${etapa}/catalogo`, { params });
  }

  upsertCatalogo(request: CatalogoRequest): Observable<CatalogoResponse> {
    return this.http.put<CatalogoResponse>(`${this.baseUrl}/catalogo`, request);
  }

  actualizarEstadoCatalogo(request: CatalogoEstadoRequest): Observable<CatalogoResponse> {
    return this.http.patch<CatalogoResponse>(`${this.baseUrl}/catalogo/estado`, request);
  }

  guardarMatriz(request: MatrizCatalogoRequest): Observable<CatalogoResponse> {
    return this.http.put<CatalogoResponse>(`${this.baseUrl}/catalogo/matriz`, request);
  }

  clonarMatriz(request: ClonarMatrizRequest): Observable<CatalogoResponse> {
    return this.http.post<CatalogoResponse>(`${this.baseUrl}/catalogo/clonar`, request);
  }
}
