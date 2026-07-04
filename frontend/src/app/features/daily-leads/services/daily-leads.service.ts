import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { PageResponse } from '../../../shared/models/common/page-response';
import { CatalogoResponse, EventoResponse, PageQuery } from '../../../shared/models/preventa/preventa.models';
import {
  DailyLeadGroupFilter,
  DailyLeadGroupsResponse,
  DailyLeadSortDirection,
  DailyLeadSortField,
  LeadDiarioResponse
} from '../models/daily-lead.model';

export interface DailyLeadsQuery {
  fecha?: string;
  lead?: string;
  pageNumber: number;
  pageSize: number;
  filters?: DailyLeadGroupFilter;
  sortBy: DailyLeadSortField;
  direction: DailyLeadSortDirection;
}

/** Catálogo mínimo de equipos para resolver nombres en los selectores. */
export interface EquipoCatalogoItem {
  id: number;
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class DailyLeadsService {
  private readonly http = inject(HttpClient);
  private readonly leadUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads`;
  private readonly authUrl = `${API_CONSTANTS.gatewayBaseUrl}/auth`;

  listarRegistrosDiarios(query: DailyLeadsQuery): Observable<PageResponse<LeadDiarioResponse>> {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize)
      .set('sortBy', query.sortBy)
      .set('direction', query.direction);

    if (query.fecha) {
      params = params.set('fecha', query.fecha);
    }
    if (query.lead) {
      params = params.set('lead', query.lead);
    }
    if (query.filters?.tipoGrupo) {
      params = params.set('tipoGrupo', query.filters.tipoGrupo);
    }
    if (query.filters?.idGrupo !== undefined) {
      params = params.set('idGrupo', query.filters.idGrupo);
    }
    if (query.filters?.codigoTipificacion) {
      params = params.set('codigoTipificacion', query.filters.codigoTipificacion);
    }
    if (query.filters?.codigoSubtipificacion) {
      params = params.set('codigoSubtipificacion', query.filters.codigoSubtipificacion);
    }
    if (query.filters?.sinValor) {
      params = params.set('sinValor', true);
    }

    return this.http.get<PageResponse<LeadDiarioResponse>>(`${this.leadUrl}/eventos/registros-diarios`, {
      params
    });
  }

  listarAgrupacionesRegistrosDiarios(fecha?: string, lead?: string): Observable<DailyLeadGroupsResponse> {
    let params = new HttpParams();
    if (fecha) {
      params = params.set('fecha', fecha);
    }
    if (lead) {
      params = params.set('lead', lead);
    }
    return this.http.get<DailyLeadGroupsResponse>(
      `${this.leadUrl}/eventos/registros-diarios/agrupaciones`,
      { params }
    );
  }

  listarCatalogoEquipos(): Observable<EquipoCatalogoItem[]> {
    return this.http.get<EquipoCatalogoItem[]>(`${this.authUrl}/equipos/catalogo`);
  }

  getCatalogoTipificaciones(etapa: string): Observable<CatalogoResponse> {
    return this.http.get<CatalogoResponse>(`${this.leadUrl}/tipificaciones/${etapa}/catalogo`);
  }

  listarEventosLead(
    idLead: number,
    fecha: string,
    query: PageQuery,
    accion?: string
  ): Observable<PageResponse<EventoResponse>> {
    let params = this.pageParams(query).set('fechaDesde', fecha).set('fechaHasta', fecha);
    if (accion) {
      params = params.set('accion', accion);
    }
    return this.http.get<PageResponse<EventoResponse>>(`${this.leadUrl}/eventos/lead/${idLead}`, {
      params
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
