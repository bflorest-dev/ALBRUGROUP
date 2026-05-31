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
  prefijo?: string;
  numeroWhatsappEmpresa?: string;
  numeroWhatsApp?: string;
  idCuentaPublicitaria?: number;
  numeroCuenta?: string;
  nombreCuenta?: string;
  idProveedor?: number;
  nombreProveedor?: string;
};

export type CampanaGastoRequest = {
  leads: number;
  costoTotal: number;
};

export type CampanaGastoResponse = {
  id: number;
  idCampana: number;
  nombreCampana: string;
  leads: number;
  leadsReales: number;
  ventasCerradas: number;
  costoTotal: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CampanaGastoCampanaResumenResponse = {
  idCampana: number;
  nombreCampana: string;
  leads: number;
  leadsReales: number;
  ventasCerradas: number;
  costoTotal: number;
  ultimoRegistroAt?: string | null;
};

export type CampanaGastoResumenDiarioResponse = {
  idCampana?: number | null;
  nombreCampana?: string | null;
  fecha: string;
  leads: number;
  leadsReales: number;
  ventasCerradas: number;
  costoTotal: number;
  ultimoRegistroAt?: string | null;
  campanas?: CampanaGastoCampanaResumenResponse[] | null;
};

export type CampanaGastoResumenMensualResponse = {
  idCampana?: number | null;
  nombreCampana?: string | null;
  anio: number;
  mes: number;
  leads: number;
  leadsReales: number;
  ventasCerradas: number;
  costoTotal: number;
  ultimoRegistroAt?: string | null;
  campanas?: CampanaGastoCampanaResumenResponse[] | null;
};

export type AdicionalResponse = LeadEntity & {
  precioUnitario?: number;
  idProveedor?: number;
  nombreProveedor?: string;
};

export type InternetResponse = {
  velocidad?: number;
  unidad?: string;
  tecnologia?: string;
};

export type TelevisionResponse = {
  nombre?: string;
  cantidadCanales?: number;
};

export type TelefonoResponse = {
  minutos?: number;
  descripcion?: string;
};

export type PlanAdicionalResponse = {
  idAdicional: number;
  nombreAdicional?: string;
  cantidadIncluida?: number;
  permiteCompraAdicional?: boolean;
  cantidadMaximaAdicional?: number;
};

export type PlanResponse = LeadEntity & {
  precio?: number;
  precioPromocional?: number;
  mesesPromocionPrecio?: number;
  vigenciaDesde?: string;
  vigenciaHasta?: string;
  idProveedor?: number;
  nombreProveedor?: string;
  internet?: InternetResponse;
  television?: TelevisionResponse;
  telefono?: TelefonoResponse;
  velocidadPromocional?: number;
  mesesPromocionVelocidad?: number;
  idZona?: number;
  nombreZona?: string;
  adicionales?: PlanAdicionalResponse[];
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

export type NivelGeografico = 'DEPARTAMENTO' | 'PROVINCIA' | 'DISTRITO';
export type CriterioZona = 'INCLUIR' | 'EXCLUIR';

export type ZonaReglaResponse = {
  id?: number;
  nivelGeografico: NivelGeografico;
  geoId: number;
  criterio: CriterioZona;
};

export type ZonaResponse = LeadEntity & {
  reglas?: ZonaReglaResponse[];
};

export type ServiciosProveedorResponse = {
  idProveedor: number;
  nombreProveedor: string;
  internets: unknown[];
  televisiones: unknown[];
  telefonos: unknown[];
};

export type UbigeoItem = {
  id: number;
  nombre: string;
  codigo?: string;
};

@Injectable({ providedIn: 'root' })
export class CommunityLeadService {
  private readonly http = inject(HttpClient);
  private readonly leadUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads`;

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

  actualizarNombreCuenta(idCuenta: number, request: { nombreCuenta: string }): Observable<CuentaPublicitariaResponse> {
    return this.http.patch<CuentaPublicitariaResponse>(`${this.leadUrl}/cuentas-publicitarias/${idCuenta}`, request);
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

  actualizarWhatsappCampana(
    idCampana: number,
    request: { prefijo: string; numeroWhatsApp: string }
  ): Observable<CampanaResponse> {
    return this.http.put<CampanaResponse>(`${this.leadUrl}/campanas/${idCampana}`, request);
  }

  alternarCampana(idCampana: number): Observable<CampanaResponse> {
    return this.http.patch<CampanaResponse>(`${this.leadUrl}/campanas/${idCampana}/estado`, {});
  }

  registrarGastoCampana(idCampana: number, request: CampanaGastoRequest): Observable<CampanaGastoResponse> {
    return this.http.post<CampanaGastoResponse>(`${this.leadUrl}/campanas/${idCampana}/gastos`, request);
  }

  listarGastosCampanaDia(idCampana: number, fecha?: string): Observable<CampanaGastoResponse[]> {
    return this.http.get<CampanaGastoResponse[]>(`${this.leadUrl}/campanas/${idCampana}/gastos`, {
      params: this.optionalDateParam('fecha', fecha)
    });
  }

  obtenerResumenGastosDiario(fecha?: string): Observable<CampanaGastoResumenDiarioResponse> {
    return this.http.get<CampanaGastoResumenDiarioResponse>(`${this.leadUrl}/campanas/gastos/resumen-diario`, {
      params: this.optionalDateParam('fecha', fecha)
    });
  }

  obtenerResumenGastosMensual(anio?: number, mes?: number): Observable<CampanaGastoResumenMensualResponse> {
    let params = new HttpParams();
    if (anio && mes) {
      params = params.set('anio', anio).set('mes', mes);
    }
    return this.http.get<CampanaGastoResumenMensualResponse>(`${this.leadUrl}/campanas/gastos/resumen-mensual`, {
      params
    });
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

  listarDepartamentos(): Observable<UbigeoItem[]> {
    return this.http.get<UbigeoItem[]>(`${this.leadUrl}/ubigeo/departamentos`);
  }

  listarProvincias(idDepartamento: number): Observable<UbigeoItem[]> {
    return this.http.get<UbigeoItem[]>(`${this.leadUrl}/ubigeo/departamentos/${idDepartamento}/provincias`);
  }

  listarDistritos(idProvincia: number): Observable<UbigeoItem[]> {
    return this.http.get<UbigeoItem[]>(`${this.leadUrl}/ubigeo/provincias/${idProvincia}/distritos`);
  }

  private optionalActivoParam(activo?: boolean): HttpParams {
    let params = new HttpParams();
    if (activo !== undefined) {
      params = params.set('activo', activo);
    }
    return params;
  }

  private optionalDateParam(name: string, value?: string): HttpParams {
    let params = new HttpParams();
    if (value) {
      params = params.set(name, value);
    }
    return params;
  }
}
