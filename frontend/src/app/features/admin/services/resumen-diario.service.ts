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

/**
 * Una fila del detalle de preventas detrás de un card. `lead` y `usermeta` vienen por separado; el
 * modal los apila en una sola columna (lead con énfasis, usermeta debajo). En INGRESADOS `rolAsesor`
 * llega nulo.
 */
export interface PreventaDetalle {
  idLead: number;
  lead: string | null;
  usermeta: string | null;
  numeroDocumento: string | null;
  nombreCompleto: string | null;
  nombreAsesor: string | null;
  tipificadoAt: string | null;
  nombreCampana: string | null;
}

/** Las 4 tablas del RESUMEN DIARIO en un solo payload (espejo del backend). */
export interface ResumenDiarioResponse {
  ingresosGestion: ResumenIngresosGestion;
  ranking: ResumenRanking;
  estadoLeads: GtrTipificacionRankingResponse[];
  gestionCampana: ResumenSubtipCampanaCelda[];
}

/**
 * Lo que se cachea de un resumen ya consultado: el payload + el equipo resuelto (nombre/color) para
 * poder pintar el header de inmediato. Vive en el servicio root, así sobrevive a la destrucción del
 * panel al cambiar de tab.
 */
export interface ResumenDiarioCacheEntry {
  resumen: ResumenDiarioResponse;
  equipoInfo: { idEquipo: number | null; nombre: string; color: string | null };
}

@Injectable({ providedIn: 'root' })
export class ResumenDiarioService {
  private readonly http = inject(HttpClient);
  private readonly leadsUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads`;

  /** Caché en memoria del último resumen por combinación de filtros (persiste toda la sesión). */
  private readonly cache = new Map<string, ResumenDiarioCacheEntry>();

  leerCache(clave: string): ResumenDiarioCacheEntry | null {
    return this.cache.get(clave) ?? null;
  }

  guardarCache(clave: string, entrada: ResumenDiarioCacheEntry): void {
    this.cache.set(clave, entrada);
  }

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

  /**
   * Detalle de leads detrás del contador de preventas de un card. `modo` elige el card:
   * GESTIONADOS (preventas ocurridas en el período) o INGRESADOS (cohorte de registro cuya
   * tipificación del `campo` es preventa).
   */
  obtenerPreventasDetalle(
    idEquipo: number | null,
    modo: GestionModo,
    campo: GestionCampoTipi,
    desde?: string,
    hasta?: string
  ): Observable<PreventaDetalle[]> {
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
    return this.http.get<PreventaDetalle[]>(
      `${this.leadsUrl}/preventa/resumen-diario/preventas-detalle`,
      { params }
    );
  }
}
