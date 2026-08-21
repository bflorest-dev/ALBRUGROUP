import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { GtrTipificacionRankingResponse } from '../../../shared/models/preventa/preventa.models';
import { GestionCampoTipi, GestionModo } from './admin-gestion-campana.service';

/** Tabla 1: preventas vs ingresados y vs gestionados. El % lo calcula el frontend. */
export interface ResumenIngresosGestion {
  ingresosTotal: number;
  ingresosPreventas: number;
  gestionTotal: number;
  gestionPreventas: number;
}

/** Fila del ranking acotado (tabla 2). Los OJT llegan colapsados en una fila con idAsesor null. */
export interface ResumenAsesor {
  idAsesor: number | null;
  nombreAsesor: string;
  totalAsignaciones: number;
  preventas: number;
}

/** Tabla 2: ranking + total de preventas del equipo (encabezado "TOTAL PREVENTAS: N"). */
export interface ResumenRanking {
  totalPreventas: number;
  asesores: ResumenAsesor[];
}

/**
 * Celda de la tabla 4: leads de una campaña cuya SUBtipificación (según el campo elegido) es
 * `codigoSubtipificacion`. Se conserva la tipificación y su orden para etiquetar "N - SUBTIP".
 */
export interface ResumenSubtipCampanaCelda {
  idEquipo: number | null;
  idCampana: number | null;
  nombreCampana: string | null;
  codigoTipificacion: string | null;
  ordenTipificacion: number | null;
  codigoSubtipificacion: string | null;
  cantidad: number;
}

/** Las 4 tablas del RESUMEN DIARIO en un solo payload (espejo del backend). */
export interface ResumenDiarioResponse {
  ingresosGestion: ResumenIngresosGestion;
  ranking: ResumenRanking;
  estadoLeads: GtrTipificacionRankingResponse[];
  gestionCampana: ResumenSubtipCampanaCelda[];
}

@Injectable({ providedIn: 'root' })
export class ResumenDiarioService {
  private readonly http = inject(HttpClient);
  private readonly leadsUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads`;

  /**
   * RESUMEN DIARIO del DASHBOARD de PREVENTA para un equipo. Si se omiten `desde`/`hasta`, el backend
   * usa el día operativo de hoy (America/Lima). `modo`/`campo` con la misma semántica que el resto de
   * métricas del dashboard.
   */
  obtenerResumenDiario(
    idEquipo: number | null,
    modo: GestionModo,
    campo: GestionCampoTipi,
    desde?: string,
    hasta?: string
  ): Observable<ResumenDiarioResponse> {
    let params = new HttpParams().set('modo', modo).set('campo', campo);
    if (idEquipo !== null && idEquipo !== undefined) {
      params = params.set('idEquipo', idEquipo);
    }
    if (desde) {
      params = params.set('desde', desde);
    }
    if (hasta) {
      params = params.set('hasta', hasta);
    }
    return this.http.get<ResumenDiarioResponse>(`${this.leadsUrl}/preventa/resumen-diario`, { params });
  }
}
