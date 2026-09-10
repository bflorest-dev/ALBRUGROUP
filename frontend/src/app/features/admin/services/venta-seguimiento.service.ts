import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';

/** Celda del desglose por tipificación. `orden` = orden de la matriz VENTA (null en RETORNO/SIN_GESTIONAR). */
export interface VentaSeguimientoCeldaTipi {
  clave: string;
  orden: number | null;
  cantidad: number;
}

/** Fila del desglose por asesor (mérito de preventa). `idAsesor` null = sin mérito (anomalía). */
export interface VentaSeguimientoAsesor {
  idAsesor: number | null;
  nombreAsesor: string | null;
  total: number;
  celdas: VentaSeguimientoCeldaTipi[];
}

/** Contadores de la Tabla 1. Los % (conversión / efectividades) los calcula el frontend. */
export interface VentaSeguimientoContadores {
  ingresadas: number;
  subidas: number;
  instaladas: number;
}

/** Fila del detalle (Tabla 4): un lead ingresado, con fecha relevante y ubicación ya resueltas. */
export interface VentaSeguimientoDetalle {
  orden: number;
  idLead: number;
  lead: string | null;
  fechaIngresoEtapa: string | null;
  ultimaCodigoTipificacion: string | null;
  ultimaCodigoSubtipificacion: string | null;
  asesorMerito: string | null;
  asesorUltimaGestion: string | null;
  fechaRelevante: string | null;
  horaRelevante: string | null;
  fechaRelevanteAt: string | null;
  tipoFechaRelevante: string | null;
  comentario: string | null;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  nombreCliente: string | null;
  celularRegistro: string | null;
  celularReferencia: string | null;
  departamento: string | null;
  distrito: string | null;
  ubigeo: string | null;
  etapaActual: string | null;
  clasificacion: string | null;
}

/** Espejo del `VentaResumenDiarioResponse` del backend: las 4 tablas del reporte diario de VENTA. */
export interface VentaSeguimientoResponse {
  contadores: VentaSeguimientoContadores;
  tipificaciones: VentaSeguimientoCeldaTipi[];
  porAsesor: VentaSeguimientoAsesor[];
  detalle: VentaSeguimientoDetalle[];
}

/** Header del poster: equipo y su color de marca (se resuelve fuera del payload). */
export interface VentaSeguimientoEquipoInfo {
  idEquipo: number | null;
  nombre: string;
  color: string | null;
}

/** Lo cacheado por combinación de filtros: payload + equipo resuelto, para pintar el header al instante. */
export interface VentaSeguimientoCacheEntry {
  resumen: VentaSeguimientoResponse;
  equipoInfo: VentaSeguimientoEquipoInfo;
}

/**
 * DASHBOARD > Seguimiento (etapa VENTA): réplica web del reporte diario del equipo. Un solo endpoint devuelve
 * el cohorte de leads ingresados a VENTA con sus 4 tablas ya derivadas; el filtrado/agrupado del detalle y los
 * % son client-side. Mismo permiso que el resumen de PREVENTA (READ_LEADS_GTR).
 */
@Injectable({ providedIn: 'root' })
export class VentaSeguimientoService {
  private readonly http = inject(HttpClient);
  private readonly leadsUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads`;

  /** Caché en memoria del último resumen por combinación de filtros (persiste toda la sesión). */
  private readonly cache = new Map<string, VentaSeguimientoCacheEntry>();

  leerCache(clave: string): VentaSeguimientoCacheEntry | null {
    return this.cache.get(clave) ?? null;
  }

  guardarCache(clave: string, entrada: VentaSeguimientoCacheEntry): void {
    this.cache.set(clave, entrada);
  }

  /**
   * Resumen diario de VENTA. Si se omiten `desde`/`hasta`, el backend usa el día operativo de hoy
   * (America/Lima). `idEquipo` = equipo del lead; `idProveedor` = proveedor del plan; ambos opcionales.
   */
  obtenerResumenDiario(
    idEquipo: number | null,
    idProveedor: number | null,
    desde?: string,
    hasta?: string
  ): Observable<VentaSeguimientoResponse> {
    let params = new HttpParams();
    if (idEquipo !== null && idEquipo !== undefined) {
      params = params.set('idEquipo', idEquipo);
    }
    if (idProveedor !== null && idProveedor !== undefined) {
      params = params.set('idProveedor', idProveedor);
    }
    if (desde) {
      params = params.set('desde', desde);
    }
    if (hasta) {
      params = params.set('hasta', hasta);
    }
    return this.http.get<VentaSeguimientoResponse>(`${this.leadsUrl}/venta/resumen-diario`, { params });
  }
}
