import { Injectable, computed, inject, signal } from '@angular/core';
import {
  AdminGestionCohortePostventaService,
  GestionCohorteFila,
  GestionCohortePostventaResponse
} from '../services/admin-gestion-cohorte-postventa.service';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const MESES_CORTOS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

const UMBRALES_INICIALES: Record<number, number> = { 1: 4.5, 2: 3.5, 3: 2.5 };
const RECIBOS_WIN = [1, 2, 3];

export interface ConteosCohorteVM {
  total: number;
  pagados: number;
  impagos: number;
  bajas: number;
  pctImpagos: number;
  pctBajas: number;
}

export interface ReciboCohorteVM {
  numeroFactura: number;
  corte1: ConteosCohorteVM;
  corte2: ConteosCohorteVM;
  total: ConteosCohorteVM;
  casosDesfavorables: number;
  umbralActual: number;
  umbralMaximo: number;
  toleranciaMaximaBajas: number;
  cumple: boolean;
}

export interface RecomendacionConversionVM {
  numeroFactura: number;
  grupos: GrupoDecisionVM[];
  total: number;
  impagos: number;
  bajas: number;
  casosDesfavorables: number;
  umbralActual: number;
  umbralMaximo: number;
  conversionesNecesarias: number;
  alcanzable: boolean;
  cumple: boolean;
}

export interface GrupoDecisionVM {
  mesCorteBase: string;
  numeroCorte: number;
  numeroRecibo: number;
  etiqueta: string;
  total: number;
  impagos: number;
  bajas: number;
}

@Injectable()
export class AdminGestionCohorteFacade {
  private readonly service = inject(AdminGestionCohortePostventaService);

  private readonly _mes = signal<{ anio: number; mes: number } | null>(null);
  private readonly _ultimaMes = signal<{ anio: number; mes: number } | null>(null);
  private readonly _response = signal<GestionCohortePostventaResponse | null>(null);
  private readonly _umbrales = signal<Record<number, number>>({ ...UMBRALES_INICIALES });
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly isLoading = this._loading.asReadonly();
  readonly errorMessage = this._error.asReadonly();
  readonly proveedor = computed(() => this._response()?.proveedor ?? 'WIN');
  readonly mesIso = computed(() => {
    const mes = this._mes();
    return mes ? paramDe(mes) : null;
  });
  readonly umbrales = this._umbrales.asReadonly();

  readonly mesLabel = computed(() => {
    const mes = this._mes();
    return mes ? `${MESES[mes.mes - 1]} ${mes.anio}` : '';
  });

  readonly canGoNext = computed(() => {
    const actual = this._mes();
    const ultima = this._ultimaMes();
    return !!actual && !!ultima && orden(actual) < orden(ultima);
  });

  readonly recibos = computed<ReciboCohorteVM[]>(() => {
    const filas = this._response()?.filas ?? [];
    const umbrales = this._umbrales();
    return RECIBOS_WIN.map((numeroFactura) => {
      const corte1 = sumar(filas.filter((fila) => fila.numeroFactura === numeroFactura && fila.numeroCorteBase === 1));
      const corte2 = sumar(filas.filter((fila) => fila.numeroFactura === numeroFactura && fila.numeroCorteBase === 2));
      const total = sumar(filas.filter((fila) => fila.numeroFactura === numeroFactura));
      const casosDesfavorables = total.bajas;
      const umbralActual = porcentaje(total.bajas, total.total);
      const umbralMaximo = umbrales[numeroFactura] ?? 0;
      const toleranciaMaximaBajas = maximoEnteroEstricto(total.total, umbralMaximo);
      return {
        numeroFactura,
        corte1,
        corte2,
        total,
        casosDesfavorables,
        umbralActual,
        umbralMaximo,
        toleranciaMaximaBajas,
        cumple: total.total > 0 && umbralActual < umbralMaximo
      };
    });
  });

  readonly fechaVencimientoObjetivo = computed(() => this._response()?.ventanaDecision.fechaVencimientoObjetivo ?? null);
  readonly fechaLimite = computed(() => this._response()?.ventanaDecision.fechaLimite ?? null);
  readonly fechaVencimientoObjetivoLabel = computed(() => fechaLabel(this.fechaVencimientoObjetivo()));
  readonly fechaLimiteLabel = computed(() => fechaLabel(this.fechaLimite()));
  readonly vencimientoOcurrido = computed(() => this._response()?.ventanaDecision.vencimientoOcurrido ?? false);
  readonly cohorteParticipaEnVentana = computed(() => {
    const response = this._response();
    return !!response && response.ventanaDecision.filas.some((fila) => fila.mesCorteBase === response.mesCohorte);
  });

  readonly recomendaciones = computed<RecomendacionConversionVM[]>(() => {
    const filas = this._response()?.ventanaDecision.filas ?? [];
    const umbrales = this._umbrales();
    const numeros = [...new Set(filas.map((fila) => fila.numeroFactura))].sort((a, b) => a - b);

    return numeros.map((numeroFactura) => {
      const filasRecibo = filas.filter((fila) => fila.numeroFactura === numeroFactura);
      const conteos = sumar(filasRecibo);
      const casosDesfavorables = conteos.impagos + conteos.bajas;
      const umbralMaximo = umbrales[numeroFactura] ?? 0;
      const maximoPermitido = maximoEnteroEstricto(conteos.total, umbralMaximo);
      const conversionesNecesarias = Math.max(0, casosDesfavorables - maximoPermitido);
      return {
        numeroFactura,
        grupos: [...filasRecibo]
          .sort((a, b) => b.mesCorteBase.localeCompare(a.mesCorteBase))
          .map((fila) => grupoDecision(fila)),
        total: conteos.total,
        impagos: conteos.impagos,
        bajas: conteos.bajas,
        casosDesfavorables,
        umbralActual: porcentaje(casosDesfavorables, conteos.total),
        umbralMaximo,
        conversionesNecesarias,
        alcanzable: conversionesNecesarias <= conteos.impagos,
        cumple: conversionesNecesarias === 0
      };
    });
  });

  start(): void {
    if (!this._response() && !this._loading()) {
      this.cargar(undefined);
    }
  }

  recargar(): void {
    this.cargar(this.paramMesActual());
  }

  mesAnterior(): void {
    const mes = this._mes();
    if (mes) {
      this.cargar(paramDe(desplazar(mes, -1)));
    }
  }

  mesSiguiente(): void {
    const mes = this._mes();
    if (mes && this.canGoNext()) {
      this.cargar(paramDe(desplazar(mes, 1)));
    }
  }

  actualizarUmbral(numeroFactura: number, valor: string | number): void {
    const numero = typeof valor === 'number' ? valor : Number(valor);
    if (!Number.isFinite(numero)) {
      return;
    }
    const normalizado = Math.min(100, Math.max(0, numero));
    this._umbrales.update((actuales) => ({ ...actuales, [numeroFactura]: normalizado }));
  }

  restablecerUmbrales(): void {
    this._umbrales.set({ ...UMBRALES_INICIALES });
  }

  private paramMesActual(): string | undefined {
    const mes = this._mes();
    return mes ? paramDe(mes) : undefined;
  }

  private cargar(mesCohorte?: string): void {
    this._loading.set(true);
    this._error.set(null);
    this.service.obtenerGestionPorCohorte(mesCohorte).subscribe({
      next: (response) => {
        this._response.set(response);
        this._mes.set(parseMes(response.mesCohorte));
        this._ultimaMes.set(response.ultimaMesCohorte ? parseMes(response.ultimaMesCohorte) : null);
        this._loading.set(false);
      },
      error: () => {
        this._error.set('No pudimos cargar el análisis por cohorte. Intenta actualizar.');
        this._loading.set(false);
      }
    });
  }
}

function sumar(filas: GestionCohorteFila[]): ConteosCohorteVM {
  const conteos = filas.reduce(
    (acc, fila) => ({
      total: acc.total + fila.total,
      pagados: acc.pagados + fila.pagadoCliente + fila.pagadoEmpresa,
      impagos: acc.impagos + fila.impagos,
      bajas: acc.bajas + fila.bajas
    }),
    { total: 0, pagados: 0, impagos: 0, bajas: 0 }
  );
  return {
    ...conteos,
    pctImpagos: porcentaje(conteos.impagos, conteos.total),
    pctBajas: porcentaje(conteos.bajas, conteos.total)
  };
}

function maximoEnteroEstricto(total: number, umbral: number): number {
  return total <= 0 ? 0 : Math.max(0, Math.ceil(total * umbral / 100) - 1);
}

function porcentaje(valor: number, total: number): number {
  return total === 0 ? 0 : valor * 100 / total;
}

function grupoDecision(fila: GestionCohorteFila): GrupoDecisionVM {
  const mes = parseMes(fila.mesCorteBase);
  return {
    mesCorteBase: fila.mesCorteBase,
    numeroCorte: fila.numeroCorteBase,
    numeroRecibo: fila.numeroFactura,
    etiqueta: `${MESES_CORTOS[mes.mes - 1]} ${fila.numeroCorteBase}`,
    total: fila.total,
    impagos: fila.impagos,
    bajas: fila.bajas
  };
}

function orden(mes: { anio: number; mes: number }): number {
  return mes.anio * 12 + mes.mes;
}

function desplazar(mes: { anio: number; mes: number }, cantidad: number): { anio: number; mes: number } {
  const total = mes.anio * 12 + (mes.mes - 1) + cantidad;
  return { anio: Math.floor(total / 12), mes: total % 12 + 1 };
}

function paramDe(mes: { anio: number; mes: number }): string {
  return `${mes.anio}-${String(mes.mes).padStart(2, '0')}-01`;
}

function parseMes(ymd: string): { anio: number; mes: number } {
  const [anio, mes] = ymd.split('-').map(Number);
  return { anio, mes };
}

function fechaLabel(ymd: string | null): string {
  if (!ymd) {
    return '';
  }
  const [anio, mes, dia] = ymd.split('-').map(Number);
  return `${dia} de ${MESES[mes - 1].toLowerCase()} de ${anio}`;
}
