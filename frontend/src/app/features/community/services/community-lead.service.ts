import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';

export type LeadEntity = Record<string, unknown> & {
  id: number;
  nombre?: string;
  activo?: boolean;
};

export type ProveedorResponse = LeadEntity & {
  cortesFacturacion?: number[];
  mesesPermanencia?: number;
};

export type CuentaPublicitariaResponse = LeadEntity & {
  numeroCuenta?: string;
  nombreCuenta?: string;
};

export type CampanaResponse = LeadEntity & {
  numeroWhatsappEmpresa?: string;
  idCuentaPublicitaria?: number;
  numeroCuenta?: string;
  nombreCuenta?: string;
  idProveedor?: number;
  nombreProveedor?: string;
};

export type AdicionalResponse = LeadEntity & {
  precioUnitario?: number;
  idProveedor?: number;
  nombreProveedor?: string;
};

export type PlanResponse = LeadEntity & {
  precio?: number;
  precioPromocional?: number;
  mesesPromocionPrecio?: number;
  vigenciaDesde?: string;
  vigenciaHasta?: string;
  idProveedor?: number;
  nombreProveedor?: string;
  internet?: unknown;
  television?: unknown;
  telefono?: unknown;
  velocidadPromocional?: number;
  mesesPromocionVelocidad?: number;
  idZona?: number;
  nombreZona?: string;
  adicionales?: unknown[];
};

export type PromocionComercialResponse = LeadEntity & {
  reglaComercial?: string;
  idProveedor?: number;
  nombreProveedor?: string;
  idZona?: number;
  nombreZona?: string;
  idsPlanes?: number[];
  nombresPlanes?: string[];
};

export type ZonaResponse = LeadEntity & {
  reglas?: unknown[];
};

export type ServiciosProveedorResponse = {
  idProveedor: number;
  nombreProveedor: string;
  internets: unknown[];
  televisiones: unknown[];
  telefonos: unknown[];
};

@Injectable({ providedIn: 'root' })
export class CommunityLeadService {
  private readonly http = inject(HttpClient);
  private readonly leadUrl = `${API_CONSTANTS.gatewayBaseUrl}/lead`;

  registrarProveedor(request: unknown): Observable<ProveedorResponse> {
    return this.http.post<ProveedorResponse>(`${this.leadUrl}/proveedores`, request);
  }

  listarProveedores(activo?: boolean): Observable<ProveedorResponse[]> {
    const params = this.optionalActivoParam(activo);
    return this.http.get<ProveedorResponse[]>(`${this.leadUrl}/proveedores`, { params });
  }

  alternarProveedor(idProveedor: number): Observable<ProveedorResponse> {
    return this.http.patch<ProveedorResponse>(`${this.leadUrl}/proveedores/${idProveedor}/estado`, {});
  }

  registrarCuenta(request: unknown): Observable<CuentaPublicitariaResponse> {
    return this.http.post<CuentaPublicitariaResponse>(`${this.leadUrl}/cuentas-publicitarias`, request);
  }

  listarCuentas(activo?: boolean): Observable<CuentaPublicitariaResponse[]> {
    const params = this.optionalActivoParam(activo);
    return this.http.get<CuentaPublicitariaResponse[]>(`${this.leadUrl}/cuentas-publicitarias`, { params });
  }

  listarCuentasActivas(): Observable<CuentaPublicitariaResponse[]> {
    return this.http.get<CuentaPublicitariaResponse[]>(`${this.leadUrl}/cuentas-publicitarias/activas`);
  }

  desactivarCuenta(idCuenta: number): Observable<void> {
    return this.http.delete<void>(`${this.leadUrl}/cuentas-publicitarias/${idCuenta}`);
  }

  registrarCampana(request: unknown): Observable<CampanaResponse> {
    return this.http.post<CampanaResponse>(`${this.leadUrl}/campanas`, request);
  }

  listarCampanas(activo?: boolean): Observable<CampanaResponse[]> {
    const params = this.optionalActivoParam(activo);
    return this.http.get<CampanaResponse[]>(`${this.leadUrl}/campanas`, { params });
  }

  actualizarWhatsappCampana(idCampana: number, numeroWhatsappEmpresa: string): Observable<CampanaResponse> {
    return this.http.put<CampanaResponse>(`${this.leadUrl}/campanas/${idCampana}`, { numeroWhatsappEmpresa });
  }

  desactivarCampana(idCampana: number): Observable<void> {
    return this.http.delete<void>(`${this.leadUrl}/campanas/${idCampana}`);
  }

  registrarAdicional(request: unknown): Observable<AdicionalResponse> {
    return this.http.post<AdicionalResponse>(`${this.leadUrl}/planes/adicionales`, request);
  }

  listarAdicionales(idProveedor?: number): Observable<AdicionalResponse[]> {
    let params = new HttpParams();
    if (idProveedor) {
      params = params.set('idProveedor', idProveedor);
    }
    return this.http.get<AdicionalResponse[]>(`${this.leadUrl}/planes/adicionales`, { params });
  }

  registrarPlan(request: unknown): Observable<PlanResponse> {
    return this.http.post<PlanResponse>(`${this.leadUrl}/planes`, request);
  }

  listarPlanes(idProveedor?: number, soloVigentes?: boolean): Observable<PlanResponse[]> {
    let params = new HttpParams();
    if (idProveedor) {
      params = params.set('idProveedor', idProveedor);
    }
    if (soloVigentes !== undefined) {
      params = params.set('soloVigentes', soloVigentes);
    }
    return this.http.get<PlanResponse[]>(`${this.leadUrl}/planes`, { params });
  }

  listarServiciosProveedor(idProveedor: number): Observable<ServiciosProveedorResponse> {
    return this.http.get<ServiciosProveedorResponse>(`${this.leadUrl}/planes/servicios`, {
      params: new HttpParams().set('idProveedor', idProveedor)
    });
  }

  actualizarPlan(idPlan: number, request: unknown): Observable<PlanResponse> {
    return this.http.put<PlanResponse>(`${this.leadUrl}/planes/${idPlan}`, request);
  }

  desactivarPlan(idPlan: number): Observable<void> {
    return this.http.delete<void>(`${this.leadUrl}/planes/${idPlan}`);
  }

  registrarPromocion(request: unknown): Observable<PromocionComercialResponse> {
    return this.http.post<PromocionComercialResponse>(`${this.leadUrl}/promociones`, request);
  }

  listarPromociones(filters: { idProveedor?: number; idZona?: number; idPlan?: number }): Observable<PromocionComercialResponse[]> {
    let params = new HttpParams();
    if (filters.idProveedor) {
      params = params.set('idProveedor', filters.idProveedor);
    }
    if (filters.idZona) {
      params = params.set('idZona', filters.idZona);
    }
    if (filters.idPlan) {
      params = params.set('idPlan', filters.idPlan);
    }
    return this.http.get<PromocionComercialResponse[]>(`${this.leadUrl}/promociones`, { params });
  }

  desactivarPromocion(idPromocion: number): Observable<void> {
    return this.http.delete<void>(`${this.leadUrl}/promociones/${idPromocion}`);
  }

  registrarZona(request: unknown): Observable<ZonaResponse> {
    return this.http.post<ZonaResponse>(`${this.leadUrl}/zonas`, request);
  }

  listarZonas(activo?: boolean): Observable<ZonaResponse[]> {
    const params = this.optionalActivoParam(activo);
    return this.http.get<ZonaResponse[]>(`${this.leadUrl}/zonas`, { params });
  }

  alternarZona(idZona: number): Observable<ZonaResponse> {
    return this.http.patch<ZonaResponse>(`${this.leadUrl}/zonas/${idZona}/estado`, {});
  }

  actualizarZona(idZona: number, request: unknown): Observable<ZonaResponse> {
    return this.http.put<ZonaResponse>(`${this.leadUrl}/zonas/${idZona}`, request);
  }

  private optionalActivoParam(activo?: boolean): HttpParams {
    let params = new HttpParams();
    if (activo !== undefined) {
      params = params.set('activo', activo);
    }
    return params;
  }
}
