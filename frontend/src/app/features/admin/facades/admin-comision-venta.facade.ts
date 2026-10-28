import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  AdminComisionVentaService,
  ComisionVentaCorte,
  ComisionVentaResponse,
  HorarioVigenteResponse
} from '../services/admin-comision-venta.service';
import { ResumenMensualResponse } from '../../../shared/models/schedule/resumen-mensual-response';

// ── Tipos de modalidad ──
export type Modalidad = 'PART_TIME' | 'FULL_TIME' | 'SEMI_FULL' | 'SUPER_FULL';

// ── Configuración editable de la matriz de comisiones ──
export interface TierFactor { desde: number; hasta: number | null; factor: number; }
export interface ModalidadConfig { cuota: number; tiers: TierFactor[]; }
export interface PenalidadFaltasConfig { faltas: number; descuento: number; }
export interface PenalidadTardanzasConfig { desdeMin: number; hastaMin: number | null; descuento: number; }

export interface ComisionConfig {
  modalidades: Record<Modalidad, ModalidadConfig>;
  penalidadFaltas: PenalidadFaltasConfig[];
  penalidadTardanzas: PenalidadTardanzasConfig[];
}

// ── View Models ──
export interface AsesorCorteVM {
  idAsesor: number;
  nombreAsesor: string;
  ventasTotales: number;
  ventasLima: number;
  modalidad: Modalidad | null;
  factor: number;
  comisionBruta: number;
  faltas: number;
  pctDsctoFaltas: number;
  minutosDesbalance: number;
  pctDsctoTardanzas: number;
  comisionFinal: number;
  cumpleCuota: boolean;
}

export interface CorteVM {
  mesCorteBase: string;
  numeroCorteBase: number;
  etiqueta: string;
  mesAsistencia: number;
  anioAsistencia: number;
  asesores: AsesorCorteVM[];
}

export interface TotalAsesorVM {
  idAsesor: number;
  nombreAsesor: string;
  comisionBruta: number;
  comisionFinal: number;
}

// ── Config por defecto (de reworks/MatrizComicionesMensuales.txt) ──
function configPorDefecto(): ComisionConfig {
  return {
    modalidades: {
      PART_TIME:  { cuota: 30, tiers: [{ desde: 30, hasta: 40, factor: 5 }, { desde: 41, hasta: 50, factor: 7 }, { desde: 51, hasta: 60, factor: 10 }, { desde: 61, hasta: null, factor: 15 }] },
      SEMI_FULL:  { cuota: 40, tiers: [{ desde: 40, hasta: 50, factor: 5 }, { desde: 51, hasta: 60, factor: 7 }, { desde: 61, hasta: 70, factor: 10 }, { desde: 71, hasta: null, factor: 15 }] },
      FULL_TIME:  { cuota: 60, tiers: [{ desde: 60, hasta: 70, factor: 5 }, { desde: 71, hasta: 80, factor: 7 }, { desde: 81, hasta: 90, factor: 10 }, { desde: 91, hasta: null, factor: 15 }] },
      SUPER_FULL: { cuota: 80, tiers: [{ desde: 80, hasta: 90, factor: 5 }, { desde: 91, hasta: 100, factor: 7 }, { desde: 101, hasta: 110, factor: 10 }, { desde: 111, hasta: null, factor: 15 }] }
    },
    penalidadFaltas: [
      { faltas: 1, descuento: 10 },
      { faltas: 2, descuento: 25 },
      { faltas: 3, descuento: 50 },
      { faltas: 4, descuento: 100 }
    ],
    penalidadTardanzas: [
      { desdeMin: 100, hastaMin: 120, descuento: 5 },
      { desdeMin: 120, hastaMin: 140, descuento: 10 },
      { desdeMin: 140, hastaMin: 160, descuento: 15 },
      { desdeMin: 160, hastaMin: 180, descuento: 20 },
      { desdeMin: 180, hastaMin: 200, descuento: 25 },
      { desdeMin: 200, hastaMin: 220, descuento: 30 },
      { desdeMin: 220, hastaMin: 240, descuento: 35 },
      { desdeMin: 240, hastaMin: null, descuento: 50 }
    ]
  };
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

@Injectable()
export class AdminComisionVentaFacade {
  private readonly service = inject(AdminComisionVentaService);

  private readonly _mes = signal<{ anio: number; mes: number } | null>(null);
  private readonly _response = signal<ComisionVentaResponse | null>(null);
  private readonly _asistenciaMap = signal<Map<string, ResumenMensualResponse>>(new Map());
  private readonly _modalidadMap = signal<Map<string, Modalidad>>(new Map());
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly fechaLimiteMorosidad = signal<string | null>(null);
  readonly config = signal<ComisionConfig>(configPorDefecto());

  readonly isLoading = this._loading.asReadonly();
  readonly errorMessage = this._error.asReadonly();

  readonly mesLabel = computed(() => {
    const m = this._mes();
    return m ? `${MESES[m.mes - 1]} ${m.anio}` : '';
  });

  readonly canGoNext = computed(() => {
    const m = this._mes();
    if (!m) return false;
    const hoy = new Date();
    const actual = { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 };
    return orden(m) < orden(actual);
  });

  readonly cortes = computed<CorteVM[]>(() => {
    const resp = this._response();
    if (!resp) return [];
    const asistencia = this._asistenciaMap();
    const modalidades = this._modalidadMap();
    const cfg = this.config();

    return resp.cortes.map(corte => ({
      mesCorteBase: corte.mesCorteBase,
      numeroCorteBase: corte.numeroCorteBase,
      etiqueta: corte.etiqueta,
      mesAsistencia: corte.mesAsistencia,
      anioAsistencia: corte.anioAsistencia,
      asesores: corte.asesores.map(a => {
        const key = `${a.idAsesor}_${corte.anioAsistencia}_${corte.mesAsistencia}`;
        const resumen = asistencia.get(key) ?? null;
        const modalidad = modalidades.get(key) ?? null;
        return calcularComisionAsesor(a, modalidad, resumen, cfg);
      })
    }));
  });

  readonly totales = computed<TotalAsesorVM[]>(() => {
    const cortesVM = this.cortes();
    const map = new Map<number, TotalAsesorVM>();
    for (const corte of cortesVM) {
      for (const a of corte.asesores) {
        const existing = map.get(a.idAsesor);
        if (existing) {
          existing.comisionBruta += a.comisionBruta;
          existing.comisionFinal += a.comisionFinal;
        } else {
          map.set(a.idAsesor, {
            idAsesor: a.idAsesor,
            nombreAsesor: a.nombreAsesor,
            comisionBruta: a.comisionBruta,
            comisionFinal: a.comisionFinal
          });
        }
      }
    }
    return [...map.values()].sort((a, b) => b.comisionFinal - a.comisionFinal);
  });

  setFechaLimiteMorosidad(fecha: string | null): void {
    this.fechaLimiteMorosidad.set(fecha);
  }

  resetConfig(): void {
    this.config.set(configPorDefecto());
  }

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
    if (m) this.cargar(paramDe(desplazar(m, -1)));
  }

  mesSiguiente(): void {
    const m = this._mes();
    if (m && this.canGoNext()) this.cargar(paramDe(desplazar(m, 1)));
  }

  private paramMesActual(): string | undefined {
    const m = this._mes();
    return m ? paramDe(m) : undefined;
  }

  private cargar(mesComision?: string): void {
    this._loading.set(true);
    this._error.set(null);

    this.service.obtenerVentasPorCorte(mesComision, 'WIN', this.fechaLimiteMorosidad()).pipe(
      switchMap(resp => {
        this._response.set(resp);
        this._mes.set(parseMes(resp.mesComision));

        const allIds = uniqueIds(resp.cortes);
        if (allIds.length === 0) return of(null);

        const asistencia$ = resp.cortes.map(c =>
          this.service.obtenerResumenAsistenciaBulk(allIds, c.anioAsistencia, c.mesAsistencia).pipe(
            map(resumenes => ({ corte: c, resumenes })),
            catchError(() => of({ corte: c, resumenes: [] as ResumenMensualResponse[] }))
          )
        );

        const horarios$ = resp.cortes.flatMap(c =>
          allIds.map(id =>
            this.service.obtenerHorarioVigente(id, `${c.anioAsistencia}-${String(c.mesAsistencia).padStart(2, '0')}-15`).pipe(
              map(h => ({ idEmpleado: id, corte: c, modalidad: h.modalidad })),
              catchError(() => of({ idEmpleado: id, corte: c, modalidad: null as Modalidad | null }))
            )
          )
        );

        return forkJoin([forkJoin(asistencia$), forkJoin(horarios$)]).pipe(
          map(([asistResults, horarioResults]) => {
            const asistMap = new Map<string, ResumenMensualResponse>();
            for (const { corte, resumenes } of asistResults) {
              for (const r of resumenes) {
                asistMap.set(`${r.idEmpleado}_${corte.anioAsistencia}_${corte.mesAsistencia}`, r);
              }
            }

            const modMap = new Map<string, Modalidad>();
            for (const h of horarioResults) {
              if (h.modalidad) {
                modMap.set(`${h.idEmpleado}_${h.corte.anioAsistencia}_${h.corte.mesAsistencia}`, h.modalidad);
              }
            }

            return { asistMap, modMap };
          })
        );
      })
    ).subscribe({
      next: (result) => {
        if (result) {
          this._asistenciaMap.set(result.asistMap);
          this._modalidadMap.set(result.modMap);
        }
        this._loading.set(false);
      },
      error: () => {
        this._error.set('No pudimos cargar las comisiones. Intenta actualizar.');
        this._loading.set(false);
      }
    });
  }
}

// ── Cálculos puros ──

function calcularComisionAsesor(
  a: { idAsesor: number; nombreAsesor: string; ventasTotales: number; ventasLima: number },
  modalidad: Modalidad | null,
  resumen: ResumenMensualResponse | null,
  cfg: ComisionConfig
): AsesorCorteVM {
  const faltas = resumen?.diasFalta ?? 0;
  const minutosDesbalance = resumen ? Math.abs(Math.min(resumen.balanceFinal, 0)) : 0;

  if (!modalidad) {
    return {
      ...a, modalidad: null, factor: 0, comisionBruta: 0,
      faltas, pctDsctoFaltas: 0, minutosDesbalance, pctDsctoTardanzas: 0,
      comisionFinal: 0, cumpleCuota: false
    };
  }

  const modCfg = cfg.modalidades[modalidad];
  const cumpleCuota = a.ventasTotales >= modCfg.cuota;
  const factor = cumpleCuota ? resolverFactor(a.ventasTotales, modCfg.tiers) : 0;
  const comisionBruta = a.ventasLima * factor;

  const pctDsctoFaltas = resolverDescuentoFaltas(faltas, cfg.penalidadFaltas);
  const pctDsctoTardanzas = resolverDescuentoTardanzas(minutosDesbalance, cfg.penalidadTardanzas);

  const descuento = comisionBruta * (pctDsctoFaltas + pctDsctoTardanzas) / 100;
  const comisionFinal = Math.max(comisionBruta - descuento, 0);

  return {
    ...a, modalidad, factor, comisionBruta,
    faltas, pctDsctoFaltas, minutosDesbalance, pctDsctoTardanzas,
    comisionFinal, cumpleCuota
  };
}

function resolverFactor(ventas: number, tiers: TierFactor[]): number {
  for (const t of tiers) {
    if (ventas >= t.desde && (t.hasta === null || ventas <= t.hasta)) {
      return t.factor;
    }
  }
  return 0;
}

function resolverDescuentoFaltas(faltas: number, config: PenalidadFaltasConfig[]): number {
  if (faltas <= 0) return 0;
  const sorted = [...config].sort((a, b) => b.faltas - a.faltas);
  for (const p of sorted) {
    if (faltas >= p.faltas) return p.descuento;
  }
  return 0;
}

function resolverDescuentoTardanzas(minutos: number, config: PenalidadTardanzasConfig[]): number {
  if (minutos <= 0) return 0;
  for (const t of config) {
    if (minutos >= t.desdeMin && (t.hastaMin === null || minutos < t.hastaMin)) {
      return t.descuento;
    }
  }
  return 0;
}

function uniqueIds(cortes: ComisionVentaCorte[]): number[] {
  const set = new Set<number>();
  for (const c of cortes) {
    for (const a of c.asesores) set.add(a.idAsesor);
  }
  return [...set];
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
