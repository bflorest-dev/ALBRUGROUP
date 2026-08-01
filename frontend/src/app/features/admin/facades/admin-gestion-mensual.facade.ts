import { Injectable, computed, inject, signal } from '@angular/core';
import {
  AdminGestionMensualPostventaService,
  GestionMensualFila,
  GestionMensualResponse
} from '../services/admin-gestion-mensual-postventa.service';

/** Fila con los porcentajes ya calculados en el front (el backend solo manda conteos). */
export interface GestionMensualFilaVM extends GestionMensualFila {
  pagados: number;
  pctPagados: number;
  pctImpagos: number;
  pctBajas: number;
}

/** Totales de la tabla (suma de filas) con sus porcentajes globales. */
export interface GestionMensualTotalesVM {
  total: number;
  pagadoCliente: number;
  pagadoEmpresa: number;
  pagados: number;
  impagos: number;
  bajas: number;
  pctPagados: number;
  pctImpagos: number;
  pctBajas: number;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIA_CAMBIO_GESTION = 15;

/**
 * Facade del panel "Gestión del mes" (POSTVENTA WIN) del Dashboard ADMIN. Bloque autónomo: se provee
 * a nivel del componente. Mantiene el mes seleccionado, pide los conteos al backend y deriva los
 * porcentajes y totales en el front. El primer load omite el mes para que el backend aplique la regla
 * del día 15, y luego adoptamos el mes que resolvió.
 */
@Injectable()
export class AdminGestionMensualFacade {
  private readonly service = inject(AdminGestionMensualPostventaService);

  private readonly _mes = signal<{ anio: number; mes: number } | null>(null);
  private readonly _response = signal<GestionMensualResponse | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly isLoading = this._loading.asReadonly();
  readonly errorMessage = this._error.asReadonly();
  readonly proveedor = computed(() => this._response()?.proveedor ?? 'WIN');

  readonly mesLabel = computed(() => {
    const m = this._mes();
    return m ? `${MESES[m.mes - 1]} ${m.anio}` : '';
  });

  /** No dejamos avanzar más allá del mes de gestión vigente (regla del día 15). */
  readonly canGoNext = computed(() => {
    const m = this._mes();
    if (!m) {
      return false;
    }
    const actual = mesGestionVigenteHoy();
    return orden(m) < orden(actual);
  });

  readonly filas = computed<GestionMensualFilaVM[]>(() =>
    (this._response()?.filas ?? []).map((f) => {
      const pagados = f.pagadoCliente + f.pagadoEmpresa;
      return {
        ...f,
        pagados,
        pctPagados: pct(pagados, f.total),
        pctImpagos: pct(f.impagos, f.total),
        pctBajas: pct(f.bajas, f.total)
      };
    })
  );

  readonly totales = computed<GestionMensualTotalesVM | null>(() => {
    const filas = this._response()?.filas ?? [];
    if (!filas.length) {
      return null;
    }
    const acc = filas.reduce(
      (t, f) => ({
        total: t.total + f.total,
        pagadoCliente: t.pagadoCliente + f.pagadoCliente,
        pagadoEmpresa: t.pagadoEmpresa + f.pagadoEmpresa,
        impagos: t.impagos + f.impagos,
        bajas: t.bajas + f.bajas
      }),
      { total: 0, pagadoCliente: 0, pagadoEmpresa: 0, impagos: 0, bajas: 0 }
    );
    const pagados = acc.pagadoCliente + acc.pagadoEmpresa;
    return {
      ...acc,
      pagados,
      pctPagados: pct(pagados, acc.total),
      pctImpagos: pct(acc.impagos, acc.total),
      pctBajas: pct(acc.bajas, acc.total)
    };
  });

  /** Carga inicial: sin mes, el backend resuelve el vigente por la regla del día 15. */
  start(): void {
    if (!this._response() && !this._loading()) {
      this.cargar(undefined);
    }
  }

  recargar(): void {
    this.cargar(this.paramMesActual());
  }

  mesAnterior(): void {
    const m = this._mes();
    if (!m) {
      return;
    }
    this.cargar(paramDe(desplazar(m, -1)));
  }

  mesSiguiente(): void {
    const m = this._mes();
    if (!m || !this.canGoNext()) {
      return;
    }
    this.cargar(paramDe(desplazar(m, 1)));
  }

  /** Salto a un mes concreto desde el selector (fecha con día 1 del mes elegido). */
  irAMes(fecha: Date | null): void {
    if (!fecha) {
      return;
    }
    this.cargar(paramDe({ anio: fecha.getFullYear(), mes: fecha.getMonth() + 1 }));
  }

  private paramMesActual(): string | undefined {
    const m = this._mes();
    return m ? paramDe(m) : undefined;
  }

  private cargar(mesGestion?: string): void {
    this._loading.set(true);
    this._error.set(null);
    this.service.obtenerGestionMensual(mesGestion).subscribe({
      next: (response) => {
        this._response.set(response);
        this._mes.set(parseMes(response.mesGestion));
        this._loading.set(false);
      },
      error: () => {
        this._error.set('No pudimos cargar la gestión del mes. Intenta actualizar.');
        this._loading.set(false);
      }
    });
  }
}

function pct(n: number, total: number): number {
  return total === 0 ? 0 : Math.round((n / total) * 1000) / 10;
}

function orden(m: { anio: number; mes: number }): number {
  return m.anio * 12 + m.mes;
}

function desplazar(m: { anio: number; mes: number }, meses: number): { anio: number; mes: number } {
  const total = m.anio * 12 + (m.mes - 1) + meses;
  return { anio: Math.floor(total / 12), mes: (total % 12) + 1 };
}

function paramDe(m: { anio: number; mes: number }): string {
  return `${m.anio}-${String(m.mes).padStart(2, '0')}-01`;
}

function parseMes(ymd: string): { anio: number; mes: number } {
  const [anio, mes] = ymd.split('-').map(Number);
  return { anio, mes };
}

function mesGestionVigenteHoy(): { anio: number; mes: number } {
  const hoy = new Date();
  const base = { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 };
  return hoy.getDate() >= DIA_CAMBIO_GESTION ? base : desplazar(base, -1);
}
