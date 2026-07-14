import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { CatalogoResponse } from '../../../shared/models/preventa/preventa.models';

/** Punto de tipificación sobre el que se arma el reporte (espejo del enum del backend). */
export type GestionCampoTipi = 'PRIMERA' | 'ULTIMA' | 'MAYOR';

/**
 * Cohorte del reporte (espejo del enum del backend):
 *  - GESTIONADOS: leads tipificados en el período (ancla en la fecha de la tipificación).
 *  - INGRESADOS: leads con evento REGISTRO en el período (ancla en el registro), por su tipi actual.
 */
export type GestionModo = 'GESTIONADOS' | 'INGRESADOS';

/**
 * Celda cruda del reporte: cantidad de leads de una campaña cuya tipificación (según el campo
 * elegido) en la etapa es `codigoTipificacion`, dentro del período. idEquipo/idCampana null =
 * "Sin equipo"/"Sin campaña". El pivote a matriz equipo → campaña lo hace el facade.
 */
export interface GestionPorCampanaCelda {
  idEquipo: number | null;
  idCampana: number | null;
  nombreCampana: string | null;
  codigoTipificacion: string;
  cantidad: number;
}

@Injectable({ providedIn: 'root' })
export class AdminGestionCampanaService {
  private readonly http = inject(HttpClient);
  private readonly leadsUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads`;

  /**
   * Reporte gestión por campaña. Si se omiten `desde`/`hasta`, el backend usa el día operativo de
   * hoy (America/Lima). El `modo` define el ancla del período: GESTIONADOS = fecha de la tipificación;
   * INGRESADOS = fecha del evento REGISTRO.
   */
  obtenerGestionPorCampana(
    campo: GestionCampoTipi,
    modo: GestionModo,
    desde?: string,
    hasta?: string,
    etapa: string = 'PREVENTA'
  ): Observable<GestionPorCampanaCelda[]> {
    let params = new HttpParams().set('etapa', etapa).set('campo', campo).set('modo', modo);
    if (desde) {
      params = params.set('desde', desde);
    }
    if (hasta) {
      params = params.set('hasta', hasta);
    }
    return this.http.get<GestionPorCampanaCelda[]>(
      `${this.leadsUrl}/eventos/metricas/gestion-por-campana`,
      { params }
    );
  }

  /** Catálogo agregado de la etapa (unión por código): da el orden de las filas y los cierres. */
  obtenerCatalogoAgregado(etapa: string = 'PREVENTA'): Observable<CatalogoResponse> {
    return this.http.get<CatalogoResponse>(`${this.leadsUrl}/tipificaciones/${etapa}/catalogo-agregado`);
  }
}
