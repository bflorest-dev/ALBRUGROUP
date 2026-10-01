import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';

export type BillingEstado = 'REVISION' | 'APROBADO' | 'PAGADO';
export type BillingModalidad = 'PARTTIME' | 'SEMIFULLTIME' | 'FULLTIME' | 'SUPERFULLTIME';
export type BillingTipoDocumento = 'DNI' | 'CE' | 'RUC10' | 'RUC20';
export type BillingConcepto =
  | 'SUELDO_AFECTO'
  | 'BONO_PRODUCTIVIDAD'
  | 'BONO_PUNTUALIDAD'
  | 'BONO_CAPACITACION'
  | 'BONO_ADICIONAL'
  | 'HORAS_EXTRA'
  | 'DESCUENTO_TARDANZAS'
  | 'DESCUENTO_FALTAS'
  | 'ADELANTO_SUELDO'
  | 'VENTAS_VALIDAS'
  | 'TARDANZA_REGISTRADA'
  | 'FALTA_REGISTRADA';
export type BillingTipoMovimiento = 'INGRESO' | 'DESCUENTO' | 'INFORMATIVO';

export type DetallePlanillaResponse = {
  id: number;
  idTramoPlanillaEmpleado: number | null;
  concepto: BillingConcepto;
  tipoMovimiento: BillingTipoMovimiento;
  descripcion: string;
  fechaReferencia: string | null;
  cantidad: number | null;
  tarifa: number | null;
  monto: number;
  fuente: string;
};

export type TramoPlanillaEmpleadoResponse = {
  id: number;
  idContrato: number;
  fechaInicioContrato: string;
  fechaFinContrato: string | null;
  fechaDesdeTramo: string;
  fechaHastaTramo: string;
  modalidadTrabajo: BillingModalidad;
  sueldoBasico: number;
  horasDia: number;
  diasValidos: number;
  pagoDiaHabil: number;
  sueldoAfecto: number;
  tardanzas: number;
  faltasInjustificadas: number;
  descuentoTardanzas: number;
  descuentoFaltas: number;
  minutosExtras: number;
  pagoExtras: number;
};

export type PlanillaEmpleadoResponse = {
  id: number;
  idEmpleado: number;
  nombres: string;
  apellidos: string;
  tipoDocumento: BillingTipoDocumento;
  numeroDocumento: string;
  modalidad: BillingModalidad;
  multipleTramos: boolean;
  sueldoBasico: number;
  diasMes: number;
  diasHabiles: number;
  pagoDiaHabil: number;
  fechaIngreso: string;
  fechaBaja: string | null;
  diasValidos: number;
  sueldoAfecto: number;
  tardanzas: number;
  faltasInjustificadas: number;
  descuentoTardanzas: number;
  descuentoFaltas: number;
  adelantoSueldo: number;
  totalDescuento: number;
  ventasValidas: number;
  bonoProductividad: number;
  bonoPuntualidad: number;
  bonoCapacitacion: number;
  bonoAdicional: number;
  minutosExtras: number;
  pagoExtras: number;
  totalBonificaciones: number;
  remuneracionNeta: number;
  tramos: TramoPlanillaEmpleadoResponse[];
  detalles: DetallePlanillaResponse[];
};

export type PlanillaGeneralResponse = {
  id: number;
  anio: number;
  mes: number;
  tipoPlanilla: string;
  estado: BillingEstado;
  moneda: string;
  versionCalculo: number;
  totalGastoPlanilla: number;
  totalDescuentos: number;
  totalBonificaciones: number;
  cantidadEmpleados: number;
  approvedAt: string | null;
  approvedBy: string | null;
  matrizCalculo: MatrizPlanillaResponse;
  empleados: PlanillaEmpleadoResponse[];
};

export type MatrizModalidadResponse = {
  id: number;
  modalidad: BillingModalidad;
  horasDia: number;
  bonoPuntualidad: number;
  ventasMinimasProductividad: number;
  bonoProductividad: number;
};

export type MatrizTardanzaResponse = {
  id: number;
  minutosDesde: number;
  minutosHasta: number;
  montoDescuento: number;
};

export type MatrizPlanillaResponse = {
  id: number;
  version: number;
  activa: boolean;
  bonoCapacitacion: number;
  comentario: string | null;
  creadoPor: string | null;
  creadoAt: string | null;
  modalidades: MatrizModalidadResponse[];
  tardanzas: MatrizTardanzaResponse[];
};

export type MatrizPlanillaRequest = {
  bonoCapacitacion: number;
  comentario: string | null;
  modalidades: Array<{
    modalidad: BillingModalidad;
    horasDia: number;
    bonoPuntualidad: number;
    ventasMinimasProductividad: number;
    bonoProductividad: number;
  }>;
  tardanzas: Array<{
    minutosDesde: number;
    minutosHasta: number;
    montoDescuento: number;
  }>;
};

export type AdelantoSueldoResponse = {
  id: number;
  idEmpleado: number;
  anio: number;
  mes: number;
  monto: number;
  descripcion: string;
  registradoPor: string | null;
  registradoAt: string | null;
};

export type BonoAdicionalResponse = {
  id: number;
  idEmpleado: number;
  anio: number;
  mes: number;
  monto: number;
  comentario: string;
  registradoPor: string | null;
  registradoAt: string | null;
};

export type PlanillaAjustesResponse = {
  idPlanilla: number;
  anio: number;
  mes: number;
  adelantos: AdelantoSueldoResponse[];
  bonosAdicionales: BonoAdicionalResponse[];
};

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly http = inject(HttpClient);
  private readonly billingUrl = `${API_CONSTANTS.gatewayBaseUrl}/billing`;

  obtenerPlanilla(anio: number, mes: number): Observable<PlanillaGeneralResponse> {
    return this.http.get<PlanillaGeneralResponse>(`${this.billingUrl}/planillas`, {
      params: this.periodParams(anio, mes)
    });
  }

  calcularPlanilla(anio: number, mes: number): Observable<PlanillaGeneralResponse> {
    return this.http.post<PlanillaGeneralResponse>(`${this.billingUrl}/planillas/calcular`, null, {
      params: this.periodParams(anio, mes)
    });
  }

  aprobarPlanilla(id: number): Observable<PlanillaGeneralResponse> {
    return this.http.post<PlanillaGeneralResponse>(`${this.billingUrl}/planillas/${id}/aprobar`, {});
  }

  obtenerMatrizActiva(): Observable<MatrizPlanillaResponse> {
    return this.http.get<MatrizPlanillaResponse>(`${this.billingUrl}/matriz-planilla/activa`);
  }

  guardarMatriz(request: MatrizPlanillaRequest): Observable<MatrizPlanillaResponse> {
    return this.http.post<MatrizPlanillaResponse>(`${this.billingUrl}/matriz-planilla`, request);
  }

  obtenerAjustes(idPlanilla: number): Observable<PlanillaAjustesResponse> {
    return this.http.get<PlanillaAjustesResponse>(`${this.billingUrl}/planillas/${idPlanilla}/ajustes`);
  }

  registrarAdelanto(request: { idEmpleado: number; anio: number; mes: number; monto: number; descripcion: string }): Observable<AdelantoSueldoResponse> {
    return this.http.post<AdelantoSueldoResponse>(`${this.billingUrl}/adelantos`, request);
  }

  registrarBonoAdicional(request: { idEmpleado: number; anio: number; mes: number; monto: number; comentario: string }): Observable<BonoAdicionalResponse> {
    return this.http.post<BonoAdicionalResponse>(`${this.billingUrl}/bonos-adicionales`, request);
  }

  private periodParams(anio: number, mes: number): HttpParams {
    return new HttpParams().set('anio', anio).set('mes', mes);
  }
}
