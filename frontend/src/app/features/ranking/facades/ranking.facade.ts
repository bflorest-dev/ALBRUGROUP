import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, filter, forkJoin, map, of, startWith, switchMap } from 'rxjs';
import {
  GtrRankingAsesorResponse,
  GtrTipificacionCampanaResponse
} from '../../../shared/models/preventa/preventa.models';
import { PreventaLeadService } from '../../preventa/services/preventa-lead.service';

export type RankingPeriod = 'dia' | 'mes' | 'historico' | 'personalizado';

type RankingRequest = {
  requestId: number;
  desde: string;
  hasta: string;
  soloActivos: boolean;
  silent: boolean;
};

type RankingState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number }
  | { status: 'refreshing'; requestId: number }
  | {
      status: 'success';
      requestId: number;
      ranking: GtrRankingAsesorResponse[];
      tipificaciones: GtrTipificacionCampanaResponse[];
    }
  | { status: 'error'; requestId: number; message: string };

const HISTORICAL_DESDE = '2000-01-01';
const PALETTE_SIZE = 8;

@Injectable()
export class RankingFacade {
  private readonly preventaService = inject(PreventaLeadService);

  private requestId = 0;
  private started = false;
  private catalogLoaded = false;
  private readonly rankingSignal = signal<RankingRequest | null>(null);
  private readonly today = this.formatLocalDate(new Date());

  readonly lockedToDay = signal(false);
  readonly period = signal<RankingPeriod>('dia');
  readonly soloActivos = signal(true);
  readonly customDesde = signal<string>('');
  readonly customHasta = signal<string>('');
  readonly customRangeError = signal<string | null>(null);
  readonly paletteByCodigo = signal<ReadonlyMap<string, number>>(new Map());

  private readonly rankingState = toSignal(
    toObservable(this.rankingSignal).pipe(
      filter((req): req is RankingRequest => req !== null),
      switchMap((req) =>
        forkJoin({
          ranking: this.preventaService.listarRankingGtr(req.desde, req.hasta, req.soloActivos),
          tipificaciones: this.preventaService.listarTipificacionesCampanaGtr(
            req.desde,
            req.hasta,
            req.soloActivos
          )
        }).pipe(
          map<
            { ranking: GtrRankingAsesorResponse[]; tipificaciones: GtrTipificacionCampanaResponse[] },
            RankingState
          >((data) => ({
            status: 'success',
            requestId: req.requestId,
            ranking: data.ranking,
            tipificaciones: data.tipificaciones
          })),
          startWith<RankingState>({
            status: req.silent ? 'refreshing' : 'loading',
            requestId: req.requestId
          }),
          catchError(() =>
            of<RankingState>({
              status: 'error',
              requestId: req.requestId,
              message: 'No pudimos cargar el ranking. Intenta de nuevo.'
            })
          )
        )
      )
    ),
    { initialValue: { status: 'idle' } as RankingState }
  );

  readonly rankingRows = computed<GtrRankingAsesorResponse[]>(() => {
    const state = this.rankingState();
    return state.status === 'success' ? state.ranking : [];
  });

  readonly tipificacionesRows = computed<GtrTipificacionCampanaResponse[]>(() => {
    const state = this.rankingState();
    return state.status === 'success' ? state.tipificaciones : [];
  });

  readonly isLoading = computed(() => this.rankingState().status === 'loading');
  readonly isRefreshing = computed(() => this.rankingState().status === 'refreshing');
  readonly errorMessage = computed(() => {
    const state = this.rankingState();
    return state.status === 'error' ? state.message : null;
  });

  readonly periodOptions: Array<{ label: string; value: RankingPeriod }> = [
    { label: 'Hoy', value: 'dia' },
    { label: 'Este mes', value: 'mes' },
    { label: 'Histórico', value: 'historico' },
    { label: 'Personalizado', value: 'personalizado' }
  ];

  start(options: { period?: RankingPeriod; lockedToDay?: boolean } = {}): void {
    const locked = options.lockedToDay ?? false;
    this.lockedToDay.set(locked);
    if (locked) {
      this.period.set('dia');
    } else if (options.period) {
      this.period.set(options.period);
    }

    if (!this.catalogLoaded) {
      this.loadCatalog();
    }

    if (!this.started) {
      this.started = true;
      this.refresh(false);
      return;
    }

    if (this.rankingState().status === 'idle') {
      this.refresh(false);
    }
  }

  setPeriod(period: RankingPeriod): void {
    if (this.lockedToDay()) {
      return;
    }
    if (this.period() === period) {
      return;
    }
    this.period.set(period);
    this.customRangeError.set(null);
    if (period !== 'personalizado') {
      this.refresh(false);
      return;
    }
    if (this.hasValidCustomRange()) {
      this.refresh(false);
    }
  }

  setCustomDesde(value: string): void {
    this.customDesde.set(value ?? '');
    this.maybeRefreshCustom();
  }

  setCustomHasta(value: string): void {
    this.customHasta.set(value ?? '');
    this.maybeRefreshCustom();
  }

  toggleSoloActivos(): void {
    this.soloActivos.update((value) => !value);
    if (this.period() === 'personalizado' && !this.hasValidCustomRange()) {
      return;
    }
    this.refresh(false);
  }

  refresh(silent = true): void {
    const range = this.resolveRange();
    if (!range) {
      return;
    }
    this.rankingSignal.set({
      requestId: ++this.requestId,
      desde: range.desde,
      hasta: range.hasta,
      soloActivos: this.soloActivos(),
      silent
    });
  }

  tipificacionTagClass(
    codigo?: string | null,
    kind: 'tipificacion' | 'subtipificacion' = 'tipificacion'
  ): string {
    const normalized = (codigo ?? '').toUpperCase();
    const base = 'ranking-tip-tag';
    if (!normalized) {
      return `${base} ${base}--neutral ${base}--${kind}`;
    }
    const indexFromCatalog = this.paletteByCodigo().get(normalized);
    const paletteIndex =
      indexFromCatalog !== undefined ? indexFromCatalog : this.hashPalette(normalized);
    return `${base} ${base}--palette-${paletteIndex} ${base}--${kind}`;
  }

  display(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return String(value);
  }

  private maybeRefreshCustom(): void {
    if (this.period() !== 'personalizado') {
      return;
    }
    if (this.hasValidCustomRange()) {
      this.customRangeError.set(null);
      this.refresh(false);
    }
  }

  private hasValidCustomRange(): boolean {
    const desde = this.customDesde();
    const hasta = this.customHasta();
    if (!desde || !hasta) {
      this.customRangeError.set(null);
      return false;
    }
    if (desde > hasta) {
      this.customRangeError.set('La fecha de inicio no puede ser posterior a la de fin.');
      return false;
    }
    return true;
  }

  private resolveRange(): { desde: string; hasta: string } | null {
    switch (this.period()) {
      case 'dia':
        return { desde: this.today, hasta: this.today };
      case 'mes':
        return { desde: `${this.today.substring(0, 8)}01`, hasta: this.today };
      case 'historico':
        return { desde: HISTORICAL_DESDE, hasta: this.today };
      case 'personalizado': {
        const desde = this.customDesde();
        const hasta = this.customHasta();
        if (!desde || !hasta || desde > hasta) {
          return null;
        }
        return { desde, hasta };
      }
    }
  }

  private loadCatalog(): void {
    this.catalogLoaded = true;
    this.preventaService.getCatalogoTipificaciones('PREVENTA').subscribe({
      next: (catalogo) => {
        const palette = new Map<string, number>();
        for (const tipificacion of catalogo.tipificaciones) {
          const code = (tipificacion.codigo ?? '').toUpperCase();
          if (code) {
            palette.set(code, this.paletteFromOrden(tipificacion.orden));
          }
        }
        this.paletteByCodigo.set(palette);
      },
      error: () => {
        this.catalogLoaded = false;
      }
    });
  }

  private paletteFromOrden(orden: number): number {
    if (!Number.isFinite(orden) || orden <= 0) {
      return 0;
    }
    return (orden - 1) % PALETTE_SIZE;
  }

  private hashPalette(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash * 31 + value.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % PALETTE_SIZE;
  }

  private formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
