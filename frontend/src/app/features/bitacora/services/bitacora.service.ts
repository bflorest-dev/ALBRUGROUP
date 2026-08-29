import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import {
  EventoResponse,
  LeadDetalleResponse,
  LeadPage,
  PageQuery
} from '../../../shared/models/preventa/preventa.models';
import { BitacoraAccion, BitacoraBusquedaResponse, BitacoraCorreccionRequest } from '../models/bitacora.models';

/**
 * Cliente HTTP de la Bitácora (tab ADMIN de corrección de leads). Pega contra el prefijo
 * `/leads/correcciones-admin`, protegido por el permiso `CORREGIR_LEAD_ADMIN` en el backend.
 */
@Injectable({ providedIn: 'root' })
export class BitacoraService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads/correcciones-admin`;

  buscar(termino: string): Observable<BitacoraBusquedaResponse[]> {
    return this.http.get<BitacoraBusquedaResponse[]>(`${this.baseUrl}/buscar`, {
      params: new HttpParams().set('buscar', termino)
    });
  }

  obtenerDetalle(idLead: number): Observable<LeadDetalleResponse> {
    return this.http.get<LeadDetalleResponse>(`${this.baseUrl}/${idLead}/detalle`);
  }

  listarHistorial(
    idLead: number,
    query: PageQuery,
    accion?: BitacoraAccion | null
  ): Observable<LeadPage<EventoResponse>> {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize)
      .set('sortBy', query.sortBy)
      .set('direction', query.direction);
    if (accion) {
      params = params.set('accion', accion);
    }
    return this.http.get<LeadPage<EventoResponse>>(`${this.baseUrl}/${idLead}/historial`, { params });
  }

  aplicarCorreccion(idLead: number, request: BitacoraCorreccionRequest): Observable<LeadDetalleResponse> {
    return this.http.post<LeadDetalleResponse>(`${this.baseUrl}/${idLead}/aplicar`, request);
  }
}
