import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { ResumenMensualResponse } from '../../../shared/models/schedule/resumen-mensual-response';

export interface ComisionVentaAsesor {
  idAsesor: number;
  nombreAsesor: string;
  ventasTotales: number;
  ventasCorte: number;
  ventasLima: number;
}

export interface ComisionVentaCorte {
  mesCorteBase: string;
  numeroCorteBase: number;
  etiqueta: string;
  mesAsistencia: number;
  anioAsistencia: number;
  asesores: ComisionVentaAsesor[];
}

export interface ComisionVentaResponse {
  mesComision: string;
  cortes: ComisionVentaCorte[];
}

export interface HorarioVigenteResponse {
  id: number;
  idEmpleado: number;
  modalidad: 'PART_TIME' | 'FULL_TIME' | 'SEMI_FULL' | 'SUPER_FULL';
}

@Injectable({ providedIn: 'root' })
export class AdminComisionVentaService {
  private readonly http = inject(HttpClient);
  private readonly leadsUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads`;
  private readonly scheduleUrl = `${API_CONSTANTS.gatewayBaseUrl}/schedule`;

  obtenerVentasPorCorte(mesComision?: string, proveedor = 'WIN', fechaLimiteMorosidad?: string | null): Observable<ComisionVentaResponse> {
    let params = new HttpParams().set('proveedor', proveedor);
    if (mesComision) {
      params = params.set('mesComision', mesComision);
    }
    if (fechaLimiteMorosidad) {
      params = params.set('fechaLimiteMorosidad', fechaLimiteMorosidad);
    }
    return this.http.get<ComisionVentaResponse>(
      `${this.leadsUrl}/comisiones/ventas-por-corte`,
      { params }
    );
  }

  obtenerResumenAsistenciaBulk(ids: number[], anio: number, mes: number): Observable<ResumenMensualResponse[]> {
    const params = new HttpParams()
      .set('ids', ids.join(','))
      .set('anio', anio)
      .set('mes', mes);
    return this.http.get<ResumenMensualResponse[]>(
      `${this.scheduleUrl}/asistencia/reporte-mensual/bulk`,
      { params }
    );
  }

  obtenerHorarioVigente(idEmpleado: number, fecha: string): Observable<HorarioVigenteResponse> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get<HorarioVigenteResponse>(
      `${this.scheduleUrl}/horarios/empleados/${idEmpleado}/vigente`,
      { params }
    );
  }
}
