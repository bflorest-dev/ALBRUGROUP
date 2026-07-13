import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, filter, forkJoin, map, of, startWith, switchMap } from 'rxjs';
import {
  GtrRankingAsesorResponse,
  GtrSubtipificacionRankingResponse,
  GtrTipificacionRankingResponse
} from '../../../shared/models/preventa/preventa.models';
import { AdminEquipoService, EquipoResponse } from '../../admin/services/admin-equipo.service';
import { PreventaLeadService } from '../../preventa/services/preventa-lead.service';

export type RankingPeriod = 'dia' | 'mes' | 'historico' | 'personalizado';
export type RankingGroupingMode = 'SIN_AGRUPAR' | 'EQUIPO';
export type RankingSortField =
  | 'conversion'
  | 'nuevosGestionadosPeriodo'
  | 'asignadosPeriodo'
  | 'gestionadosPeriodo'
  | 'nuevasOportunidadesPeriodo'
  | 'preventasPeriodo'
  | 'nombreAsesor';
export type RankingSortDirection = 'asc' | 'desc';

export type RankingBlock = {
  idEquipo: number | null;
  nombreEquipo: string;
  ranking: RankingAdvisorView[];
  tipificaciones: GtrTipificacionRankingResponse[];
};

export type RankingAdvisorView = GtrRankingAsesorResponse & {
  conversion: number;
};

type RankingBlockResponse = Omit<RankingBlock, 'ranking'> & {
  ranking: GtrRankingAsesorResponse[];
};

type RankingRequest = {
  requestId: number;
  desde: string;
  hasta: string;
  soloActivos: boolean;
  silent: boolean;
  blocks: Array<{ idEquipo: number | null; nombreEquipo: string }>;
};

type RankingState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number }
  | { status: 'refreshing'; requestId: number }
  | { status: 'success'; requestId: number; blocks: RankingBlockResponse[] }
  | { status: 'error'; requestId: number; message: string };

type DetailRequest = {
  requestId: number;
  codigoTipificacion: string;
  idEquipo: number | null;
  desde: string;
  hasta: string;
  soloActivos: boolean;
};

type DetailState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number; codigoTipificacion: string; idEquipo: number | null }
  | {
      status: 'success';
      requestId: number;
      codigoTipificacion: string;
      idEquipo: number | null;
      rows: GtrSubtipificacionRankingResponse[];
    }
  | { status: 'error'; requestId: number; codigoTipificacion: string; idEquipo: number | null; message: string };

const HISTORICAL_DESDE = '2000-01-01';
const PALETTE_SIZE = 8;

@Injectable()
export class RankingFacade {
  private readonly preventaService = inject(PreventaLeadService);
  private readonly equipoService = inject(AdminEquipoService);

  private requestId = 0;
  private detailRequestId = 0;
  private started = false;
  private catalogLoaded = false;
  private teamsLoaded = false;
  private readonly rankingSignal = signal<RankingRequest | null>(null);
  private readonly detailSignal = signal<DetailRequest | null>(null);
  private readonly today = this.formatLocalDate(new Date());

  readonly lockedToDay = signal(false);
  readonly allowTeamOrganization = signal(false);
  readonly period = signal<RankingPeriod>('dia');
  readonly soloActivos = signal(false);
  readonly customDesde = signal<string>('');
  readonly customHasta = signal<string>('');
  readonly customDesdeDate = computed(() => this.parseLocalDate(this.customDesde()));
  readonly customHastaDate = computed(() => this.parseLocalDate(this.customHasta()));
  readonly customRangeError = signal<string | null>(null);
  readonly paletteByCodigo = signal<ReadonlyMap<string, number>>(new Map());
  readonly groupingMode = signal<RankingGroupingMode>('SIN_AGRUPAR');
  readonly selectedTeamId = signal<number | null>(null);
  readonly sortField = signal<RankingSortField>('conversion');
  readonly sortDirection = signal<RankingSortDirection>('desc');
  readonly teams = signal<EquipoResponse[]>([]);
  readonly detailOpen = signal(false);

  private readonly rankingState = toSignal(
    toObservable(this.rankingSignal).pipe(
      filter((req): req is RankingRequest => req !== null),
      switchMap((req) =>
        forkJoin(
          req.blocks.map((block) =>
            forkJoin({
              ranking: this.preventaService.listarRankingGtr(
                req.desde,
                req.hasta,
                false,
                block.idEquipo
              ),
              tipificaciones: this.preventaService.listarTipificacionesRankingGtr(
                req.desde,
                req.hasta,
                false,
                block.idEquipo
              )
            }).pipe(map((data): RankingBlockResponse => ({ ...block, ...data })))
          )
        ).pipe(
          map<RankingBlockResponse[], RankingState>((blocks) => ({ status: 'success', requestId: req.requestId, blocks })),
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

  private readonly detailState = toSignal(
    toObservable(this.detailSignal).pipe(
      filter((request): request is DetailRequest => request !== null),
      switchMap((request) =>
        this.preventaService
          .listarSubtipificacionesRankingGtr(
            request.codigoTipificacion,
            request.desde,
            request.hasta,
            request.soloActivos,
            request.idEquipo
          )
          .pipe(
            map<GtrSubtipificacionRankingResponse[], DetailState>((rows) => ({
              status: 'success',
              requestId: request.requestId,
              codigoTipificacion: request.codigoTipificacion,
              idEquipo: request.idEquipo,
              rows
            })),
            startWith<DetailState>({
              status: 'loading',
              requestId: request.requestId,
              codigoTipificacion: request.codigoTipificacion,
              idEquipo: request.idEquipo
            }),
            catchError(() =>
              of<DetailState>({
                status: 'error',
                requestId: request.requestId,
                codigoTipificacion: request.codigoTipificacion,
                idEquipo: request.idEquipo,
                message: 'No pudimos cargar el detalle de la tipificación.'
              })
            )
          )
      )
    ),
    { initialValue: { status: 'idle' } as DetailState }
  );

  readonly rankingBlocks = computed<RankingBlock[]>(() => {
    const state = this.rankingState();
    if (state.status !== 'success') {
      return [];
    }
    return state.blocks.map((block) => ({
      ...block,
      ranking: block.ranking
        .map((row) => ({ ...row, conversion: this.calcularConversion(row) }))
        .sort((a, b) => this.compareRankingRows(a, b))
    }));
  });
  readonly isLoading = computed(() => this.rankingState().status === 'loading');
  readonly isRefreshing = computed(() => this.rankingState().status === 'refreshing');
  readonly errorMessage = computed(() => {
    const state = this.rankingState();
    return state.status === 'error' ? state.message : null;
  });
  readonly visibleTeams = computed(() => {
    const selected = this.selectedTeamId();
    return selected === null ? this.teams() : this.teams().filter((team) => team.id === selected);
  });
  readonly teamOptions = computed(() => this.teams().map((team) => ({
    label: this.teamLabel(team),
    value: team.id
  })));
  readonly organizationSummary = computed(() => {
    const sort = this.sortOptions.find((option) => option.value === this.sortField())?.label ?? 'Conversión';
    const direction = this.sortDirectionOptions().find((option) => option.value === this.sortDirection())?.label ?? 'Mayor cantidad primero';
    const selected = this.teams().find((team) => team.id === this.selectedTeamId());
    const grouping = this.groupingMode() === 'SIN_AGRUPAR'
      ? 'Total general'
      : selected ? `Equipo: ${this.teamLabel(selected)}` : 'Equipos separados';
    return `${grouping} · ${sort} (${direction})`;
  });
  readonly groupingModeOptions: Array<{ label: string; value: RankingGroupingMode }> = [
    { label: 'Sin agrupar', value: 'SIN_AGRUPAR' },
    { label: 'Equipo', value: 'EQUIPO' }
  ];
  readonly sortOptions: Array<{ label: string; value: RankingSortField }> = [
    { label: 'Conversión', value: 'conversion' },
    { label: '1er contacto', value: 'nuevosGestionadosPeriodo' },
    { label: 'Asignados', value: 'asignadosPeriodo' },
    { label: 'Gestionados', value: 'gestionadosPeriodo' },
    { label: 'Nuevas oportunidades', value: 'nuevasOportunidadesPeriodo' },
    { label: 'Preventas', value: 'preventasPeriodo' },
    { label: 'Asesor', value: 'nombreAsesor' }
  ];
  readonly sortDirectionOptions = computed<Array<{ label: string; value: RankingSortDirection }>>(() =>
    this.sortField() === 'nombreAsesor'
      ? [
          { label: 'A–Z', value: 'asc' },
          { label: 'Z–A', value: 'desc' }
        ]
      : [
          { label: 'Mayor cantidad primero', value: 'desc' },
          { label: 'Menor cantidad primero', value: 'asc' }
        ]
  );
  readonly detailRows = computed(() => {
    const state = this.detailState();
    return state.status === 'success' ? state.rows : [];
  });
  readonly detailLoading = computed(() => this.detailState().status === 'loading');
  readonly detailError = computed(() => {
    const state = this.detailState();
    return state.status === 'error' ? state.message : null;
  });
  readonly detailTipificacion = computed(() => {
    const state = this.detailState();
    return state.status === 'idle' ? '' : state.codigoTipificacion;
  });

  readonly periodOptions: Array<{ label: string; value: RankingPeriod }> = [
    { label: 'Hoy', value: 'dia' },
    { label: 'Este mes', value: 'mes' },
    { label: 'Personalizado', value: 'personalizado' }
  ];
  readonly showMonthlyPreventas = computed(() => this.period() === 'dia');
  readonly periodPreventasLabel = computed(() =>
    this.period() === 'dia' ? 'Preventas de hoy' : 'Preventas del período'
  );

  start(options: { period?: RankingPeriod; lockedToDay?: boolean; allowTeamOrganization?: boolean } = {}): void {
    const locked = options.lockedToDay ?? false;
    this.lockedToDay.set(locked);
    this.allowTeamOrganization.set(options.allowTeamOrganization ?? false);
    if (locked) {
      this.period.set('dia');
    } else if (options.period) {
      this.period.set(options.period);
    }
    if (!this.catalogLoaded) this.loadCatalog();
    if (this.allowTeamOrganization() && !this.teamsLoaded) this.loadTeams();
    if (!this.started) {
      this.started = true;
      this.refresh(false);
    } else if (this.rankingState().status === 'idle') {
      this.refresh(false);
    }
  }

  setPeriod(period: RankingPeriod): void {
    if (this.lockedToDay() || this.period() === period) return;
    this.period.set(period);
    this.customRangeError.set(null);
    if (period !== 'personalizado' || this.hasValidCustomRange()) this.refresh(false);
  }

  setCustomDesde(value: string): void {
    this.customDesde.set(value ?? '');
    this.maybeRefreshCustom();
  }

  setCustomHasta(value: string): void {
    this.customHasta.set(value ?? '');
    this.maybeRefreshCustom();
  }

  setCustomDesdeDate(value: Date | null): void {
    this.setCustomDesde(value ? this.formatLocalDate(value) : '');
  }

  setCustomHastaDate(value: Date | null): void {
    this.setCustomHasta(value ? this.formatLocalDate(value) : '');
  }

  setGroupingMode(mode: RankingGroupingMode | null | undefined): void {
    if (!this.allowTeamOrganization() || !mode || this.groupingMode() === mode) return;
    this.groupingMode.set(mode);
    this.selectedTeamId.set(null);
    this.closeTipificacionDetail();
    this.refresh(false);
  }

  setSelectedTeam(idEquipo: number | null | undefined): void {
    const selected = idEquipo ?? null;
    if (this.selectedTeamId() === selected) return;
    this.selectedTeamId.set(selected);
    this.closeTipificacionDetail();
    this.refresh(false);
  }

  setSortField(field: RankingSortField | null | undefined): void {
    if (!field || this.sortField() === field) return;
    this.sortField.set(field);
    this.sortDirection.set(field === 'nombreAsesor' ? 'asc' : 'desc');
  }

  setSortDirection(direction: RankingSortDirection | null | undefined): void {
    if (!direction || this.sortDirection() === direction) return;
    this.sortDirection.set(direction);
  }

  toggleSoloActivos(): void {
    this.soloActivos.set(false);
    if (this.period() !== 'personalizado' || this.hasValidCustomRange()) this.refresh(false);
  }

  refresh(silent = true): void {
    const range = this.resolveRange();
    if (!range) return;
    this.closeTipificacionDetail();
    this.rankingSignal.set({
      requestId: ++this.requestId,
      desde: range.desde,
      hasta: range.hasta,
      soloActivos: false,
      silent,
      blocks: this.resolveBlocks()
    });
  }

  openTipificacionDetail(codigoTipificacion: string, idEquipo: number | null): void {
    const range = this.resolveRange();
    if (!range || !codigoTipificacion) return;
    this.detailOpen.set(true);
    this.detailSignal.set({
      requestId: ++this.detailRequestId,
      codigoTipificacion,
      idEquipo,
      desde: range.desde,
      hasta: range.hasta,
      soloActivos: false
    });
  }

  closeTipificacionDetail(): void {
    this.detailOpen.set(false);
  }

  teamLabel(team: EquipoResponse): string {
    return team.activo ? team.nombre : `${team.nombre} (inactivo)`;
  }

  tipificacionTagClass(codigo?: string | null, kind: 'tipificacion' | 'subtipificacion' = 'tipificacion'): string {
    const normalized = (codigo ?? '').toUpperCase();
    const base = 'ranking-tip-tag';
    if (!normalized) return `${base} ${base}--neutral ${base}--${kind}`;
    const paletteIndex = this.paletteByCodigo().get(normalized) ?? this.hashPalette(normalized);
    return `${base} ${base}--palette-${paletteIndex} ${base}--${kind}`;
  }

  display(value: unknown): string {
    return value === null || value === undefined || value === '' ? '-' : String(value);
  }

  percentage(value: number): string {
    return Number.isFinite(value) ? `${value.toFixed(1)}%` : '0.0%';
  }

  private calcularConversion(row: GtrRankingAsesorResponse): number {
    if (!row.gestionadosPeriodo) {
      return 0;
    }
    return Math.round((row.preventasPeriodo * 1000) / row.gestionadosPeriodo) / 10;
  }

  private compareRankingRows(a: RankingAdvisorView, b: RankingAdvisorView): number {
    const field = this.sortField();
    const direction = this.sortDirection();
    const multiplier = direction === 'asc' ? 1 : -1;

    if (field === 'nombreAsesor') {
      const main = this.display(a.nombreAsesor).localeCompare(this.display(b.nombreAsesor));
      return main * multiplier || b.conversion - a.conversion;
    }

    const main = (this.rankingNumericValue(a, field) - this.rankingNumericValue(b, field)) * multiplier;
    return main || this.display(a.nombreAsesor).localeCompare(this.display(b.nombreAsesor));
  }

  private rankingNumericValue(row: RankingAdvisorView, field: Exclude<RankingSortField, 'nombreAsesor'>): number {
    return row[field] ?? 0;
  }

  private resolveBlocks(): Array<{ idEquipo: number | null; nombreEquipo: string }> {
    if (!this.allowTeamOrganization() || this.groupingMode() === 'SIN_AGRUPAR') {
      return [{ idEquipo: null, nombreEquipo: 'Total general' }];
    }
    return this.visibleTeams().map((team) => ({ idEquipo: team.id, nombreEquipo: this.teamLabel(team) }));
  }

  private maybeRefreshCustom(): void {
    if (this.period() === 'personalizado' && this.hasValidCustomRange()) {
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
      this.customRangeError.set('La fecha de inicio no puede ser posterior a la fecha final.');
      return false;
    }
    return true;
  }

  private resolveRange(): { desde: string; hasta: string } | null {
    switch (this.period()) {
      case 'dia': return { desde: this.today, hasta: this.today };
      case 'mes': return { desde: `${this.today.substring(0, 8)}01`, hasta: this.today };
      case 'historico': return { desde: HISTORICAL_DESDE, hasta: this.today };
      case 'personalizado': {
        const desde = this.customDesde();
        const hasta = this.customHasta();
        return desde && hasta && desde <= hasta ? { desde, hasta } : null;
      }
    }
  }

  private loadCatalog(): void {
    this.catalogLoaded = true;
    this.preventaService.getCatalogoAgregado('PREVENTA').subscribe({
      next: (catalogo) => {
        const palette = new Map<string, number>();
        for (const tipificacion of catalogo.tipificaciones) {
          const code = (tipificacion.codigo ?? '').toUpperCase();
          if (code) palette.set(code, this.paletteFromOrden(tipificacion.orden));
        }
        this.paletteByCodigo.set(palette);
      },
      error: () => this.catalogLoaded = false
    });
  }

  private loadTeams(): void {
    this.teamsLoaded = true;
    this.equipoService.listarEquipos().subscribe({
      next: (teams) => {
        this.teams.set([...teams].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        if (this.groupingMode() === 'EQUIPO') this.refresh(false);
      },
      error: () => this.teamsLoaded = false
    });
  }

  private paletteFromOrden(orden: number): number {
    return Number.isFinite(orden) && orden > 0 ? (orden - 1) % PALETTE_SIZE : 0;
  }

  private hashPalette(value: string): number {
    let hash = 0;
    for (let index = 0; index < value.length; index++) hash = (hash * 31 + value.charCodeAt(index)) | 0;
    return Math.abs(hash) % PALETTE_SIZE;
  }

  private formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseLocalDate(value: string): Date | null {
    if (!value) {
      return null;
    }
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) {
      return null;
    }
    return new Date(year, month - 1, day);
  }
}
