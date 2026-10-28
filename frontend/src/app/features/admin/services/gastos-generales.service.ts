import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';

// ── Interfaces ──

export interface GrupoGasto {
  id: number;
  nombre: string;
  orden: number;
}

export type CategoriaGasto = 'FIJO' | 'VARIABLE';

export interface TipoGasto {
  id: number;
  grupo: GrupoGasto;
  nombre: string;
  categoria: CategoriaGasto;
  activo: boolean;
}

export interface Gasto {
  id: number;
  idTipoGasto: number;
  nombreTipoGasto: string;
  monto: number;
  documento: string | null;
  descripcion: string | null;
  fecha: string;
  createdAt: string;
}

export interface LineaGasto {
  idTipoGasto: number;
  nombreTipoGasto: string;
  categoria: string;
  acumuladoMes: number;
  cantidadRegistros: number;
}

export interface GrupoResumen {
  idGrupo: number;
  nombreGrupo: string;
  orden: number;
  lineas: LineaGasto[];
  subtotalGrupo: number;
}

export interface ResumenGastosMensual {
  anio: number;
  mes: number;
  grupos: GrupoResumen[];
  subtotalFijos: number;
  subtotalVariables: number;
  ctaBancaria: number;
  ctaPublicitaria: number;
  cashbackPreventa: number;
  cashbackPostventa: number;
  totalGeneral: number;
}

// ── Payloads ──

export interface GrupoGastoPayload {
  nombre: string;
  orden: number;
}

export interface TipoGastoPayload {
  idGrupoGasto: number;
  nombre: string;
  categoria: CategoriaGasto;
}

export interface GastoPayload {
  idTipoGasto: number;
  monto: number;
  documento?: string;
  descripcion?: string;
  fecha: string;
}

@Injectable({ providedIn: 'root' })
export class GastosGeneralesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads/gastos-generales`;

  // ── Grupos ──

  listarGrupos(): Observable<GrupoGasto[]> {
    return this.http.get<GrupoGasto[]>(`${this.baseUrl}/grupos`);
  }

  crearGrupo(payload: GrupoGastoPayload): Observable<GrupoGasto> {
    return this.http.post<GrupoGasto>(`${this.baseUrl}/grupos`, payload);
  }

  editarGrupo(id: number, payload: GrupoGastoPayload): Observable<GrupoGasto> {
    return this.http.put<GrupoGasto>(`${this.baseUrl}/grupos/${id}`, payload);
  }

  eliminarGrupo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/grupos/${id}`);
  }

  // ── Tipos ──

  listarTipos(soloActivos = false): Observable<TipoGasto[]> {
    const params = new HttpParams().set('soloActivos', soloActivos);
    return this.http.get<TipoGasto[]>(`${this.baseUrl}/tipos`, { params });
  }

  crearTipo(payload: TipoGastoPayload): Observable<TipoGasto> {
    return this.http.post<TipoGasto>(`${this.baseUrl}/tipos`, payload);
  }

  editarTipo(id: number, payload: TipoGastoPayload): Observable<TipoGasto> {
    return this.http.put<TipoGasto>(`${this.baseUrl}/tipos/${id}`, payload);
  }

  desactivarTipo(id: number): Observable<TipoGasto> {
    return this.http.patch<TipoGasto>(`${this.baseUrl}/tipos/${id}/desactivar`, {});
  }

  // ── Gastos ──

  listarGastos(desde: string, hasta: string, idTipoGasto?: number): Observable<Gasto[]> {
    let params = new HttpParams().set('desde', desde).set('hasta', hasta);
    if (idTipoGasto != null) params = params.set('idTipoGasto', idTipoGasto);
    return this.http.get<Gasto[]>(`${this.baseUrl}/gastos`, { params });
  }

  crearGasto(payload: GastoPayload): Observable<Gasto> {
    return this.http.post<Gasto>(`${this.baseUrl}/gastos`, payload);
  }

  editarGasto(id: number, payload: GastoPayload): Observable<Gasto> {
    return this.http.put<Gasto>(`${this.baseUrl}/gastos/${id}`, payload);
  }

  eliminarGasto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/gastos/${id}`);
  }

  // ── Resumen ──

  resumenMensual(anio: number, mes: number): Observable<ResumenGastosMensual> {
    const params = new HttpParams().set('anio', anio).set('mes', mes);
    return this.http.get<ResumenGastosMensual>(`${this.baseUrl}/resumen-mensual`, { params });
  }
}
