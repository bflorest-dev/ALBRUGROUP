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
  empleados: PlanillaEmpleadoResponse[];
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

  private periodParams(anio: number, mes: number): HttpParams {
    return new HttpParams().set('anio', anio).set('mes', mes);
  }
}
