import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { PageResponse } from '../../../shared/models/common/page-response';
import { CatalogoResponse, EventoResponse, PageQuery } from '../../../shared/models/preventa/preventa.models';
import { LeadDiarioResponse } from '../models/daily-lead.model';

export interface DailyLeadsQuery {
  fecha?: string;
  pageNumber: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class DailyLeadsService {
  private readonly http = inject(HttpClient);
  private readonly leadUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads`;

  listarRegistrosDiarios(query: DailyLeadsQuery): Observable<PageResponse<LeadDiarioResponse>> {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize)
      .set('sortBy', 'createdAt')
      .set('direction', 'desc');

    if (query.fecha) {
      params = params.set('fecha', query.fecha);
    }

    return this.http.get<PageResponse<LeadDiarioResponse>>(`${this.leadUrl}/eventos/registros-diarios`, {
      params
    });
  }

  getCatalogoTipificaciones(etapa: string): Observable<CatalogoResponse> {
    return this.http.get<CatalogoResponse>(`${this.leadUrl}/tipificaciones/${etapa}/catalogo`);
  }

  listarEventosLead(idLead: number, fecha: string, query: PageQuery): Observable<PageResponse<EventoResponse>> {
    return this.http.get<PageResponse<EventoResponse>>(`${this.leadUrl}/eventos/lead/${idLead}`, {
      params: this.pageParams(query).set('fechaDesde', fecha).set('fechaHasta', fecha)
    });
  }

  private pageParams(query: PageQuery): HttpParams {
    return new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize)
      .set('sortBy', query.sortBy)
      .set('direction', query.direction);
  }
}
