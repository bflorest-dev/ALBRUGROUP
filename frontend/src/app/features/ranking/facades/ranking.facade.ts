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

export type RankingGroupingMode = 'SIN_AGRUPAR' | 'EQUIPO';
export type RankingModo = 'GESTIONADOS' | 'INGRESADOS';
export type RankingCampo = 'MAYOR' | 'ULTIMA' | 'PRIMERA';
export type RankingSortField =
  | 'conversion'
  | 'nuevosGestionadosPeriodo'
  | 'asignadosPeriodo'
  | 'gestionadosPeriodo'
  | 'nuevasOportunidadesPeriodo'
  | 'preventasPeriodo'
  | 'nombreAsesor';
export type RankingSortDirection = 'asc' | 'desc';

/** Un tramo del donut de tipificaciones/subtipificaciones. colorIndex mapea a la paleta del donut. */
export interface RankingDonutSegment {
  codigo: string;
  label: string;
  cantidad: number;
  porcentaje: number;
  colorIndex: number;
}

export type RankingBlock = {
  idEquipo: number | null;
  nombreEquipo: string;
  ranking: RankingAdvisorView[];
  donutSegments: RankingDonutSegment[];
};

export type RankingAdvisorView = GtrRankingAsesorResponse & {
  conversion: number;
};

type RankingBlockResponse = {
  idEquipo: number | null;
  nombreEquipo: string;
  ranking: GtrRankingAsesorResponse[];
  tipificaciones: GtrTipificacionRankingResponse[];
};

type RankingRequest = {
  requestId: number;
  desde: string;
  hasta: string;
  modo: RankingModo;
  campo: RankingCampo;
  silent: boolean;
  blocks: Array<{ idEquipo: number | null; nombreEquipo: string }>;
};

type RankingRange = { desde: string; hasta: string };

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
  modo: RankingModo;
  campo: RankingCampo;
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

interface TipiMeta {
  descripcion: string;
  orden: number;
  subtipis: Map<string, { descripcion: string; orden: number }>;
}

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

  readonly today = this.startOfDay(new Date());
  readonly allowTeamOrganization = signal(false);
  readonly selectedDay = signal<Date>(this.startOfDay(new Date()));
  readonly modo = signal<RankingModo>('GESTIONADOS');
  readonly campo = signal<RankingCampo>('MAYOR');
  private readonly fixedRange = signal<RankingRange | null>(null);
  private readonly catalog = signal<ReadonlyMap<string, TipiMeta>>(new Map());
  private readonly fixedTeamId = signal<number | null>(null);
  readonly groupingMode = signal<RankingGroupingMode>('SIN_AGRUPAR');
  readonly selectedTeamId = signal<number | null>(null);
  readonly sortField = signal<RankingSortField>('conversion');
  readonly sortDirection = signal<RankingSortDirection>('desc');
  readonly teams = signal<EquipoResponse[]>([]);
  // Drill activo (una tipificación a la vez, por bloque): su donut muestra subtipificaciones.
  readonly activeDrill = signal<{ idEquipo: number | null; codigo: string } | null>(null);

  readonly showMonthlyPreventas = computed(() => true);
  readonly periodPreventasLabel = computed(() => 'Preventas del día');

  readonly modoOptions: Array<{ label: string; value: RankingModo }> = [
    { label: 'Gestionados', value: 'GESTIONADOS' },
    { label: 'Ingresados', value: 'INGRESADOS' }
  ];
  readonly campoOptions: Array<{ label: string; value: RankingCampo }> = [
    { label: 'Mayor', value: 'MAYOR' },
    { label: 'Última', value: 'ULTIMA' },
    { label: 'Primera', value: 'PRIMERA' }
  ];

  private readonly rankingState = toSignal(
    toObservable(this.rankingSignal).pipe(
      filter((req): req is RankingRequest => req !== null),
      switchMap((req) =>
        forkJoin(
          req.blocks.map((block) =>
            forkJoin({
              ranking: this.preventaService.listarRankingGtr(req.desde, req.hasta, false, block.idEquipo),
              tipificaciones: this.preventaService.listarTipificacionesRankingGtr(
                req.desde,
                req.hasta,
                false,
                block.idEquipo,
                req.modo,
                req.campo
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
            false,
            request.idEquipo,
            request.modo,
            request.campo
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
      idEquipo: block.idEquipo,
      nombreEquipo: block.nombreEquipo,
      ranking: block.ranking
        .map((row) => ({ ...row, conversion: this.calcularConversion(row) }))
        .sort((a, b) => this.compareRankingRows(a, b)),
      donutSegments: this.buildTipiSegments(block.tipificaciones)
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
  readonly teamOptions = computed(() => this.teams().map((team) => ({ label: this.teamLabel(team), value: team.id })));
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

  // ── Drill de subtipificaciones ──────────────────────────────────────────
  readonly drillTitle = computed(() => {
    const drill = this.activeDrill();
    return drill ? this.labelForTipi(drill.codigo) : '';
  });
  readonly drillLoading = computed(() => this.detailState().status === 'loading');
  readonly drillError = computed(() => {
    const state = this.detailState();
    return state.status === 'error' ? state.message : null;
  });
  readonly drillSegments = computed<RankingDonutSegment[]>(() => {
    const state = this.detailState();
    const drill = this.activeDrill();
    if (!drill || state.status !== 'success' || state.codigoTipificacion !== drill.codigo) {
      return [];
    }
    return this.buildSubtipiSegments(drill.codigo, state.rows);
  });

  isDrilled(idEquipo: number | null): boolean {
    const drill = this.activeDrill();
    return drill !== null && drill.idEquipo === idEquipo;
  }

  start(options: { allowTeamOrganization?: boolean } = {}): void {
    this.allowTeamOrganization.set(options.allowTeamOrganization ?? false);
    if (!this.catalogLoaded) this.loadCatalog();
    if (this.allowTeamOrganization() && !this.teamsLoaded) this.loadTeams();
    if (!this.started) {
      this.started = true;
      this.refresh(false);
    } else if (this.rankingState().status === 'idle') {
      this.refresh(false);
    }
  }

  setFixedTeamId(idEquipo: number | null): void {
    const nextId = idEquipo && Number.isFinite(idEquipo) && idEquipo > 0 ? idEquipo : null;
    if (this.fixedTeamId() === nextId) return;
    this.fixedTeamId.set(nextId);
    this.selectedTeamId.set(null);
    this.closeDrill();
    if (this.started) {
      this.refresh(false);
    }
  }

  setSelectedDay(value: Date | null): void {
    if (!value) return;
    const day = this.startOfDay(value);
    if (day.getTime() === this.selectedDay().getTime()) return;
    this.selectedDay.set(day);
    this.fixedRange.set(null);
    this.refresh(false);
  }

  setRange(desde: string, hasta: string): void {
    if (!desde || !hasta) return;
    const current = this.fixedRange();
    if (current?.desde === desde && current.hasta === hasta) return;
    this.fixedRange.set({ desde, hasta });
    this.closeDrill();
    if (this.started) {
      this.refresh(false);
    }
  }

  setModo(value: RankingModo | null | undefined): void {
    if (!value || this.modo() === value) return;
    this.modo.set(value);
    this.closeDrill();
    this.refresh(false);
  }

  setCampo(value: RankingCampo | null | undefined): void {
    if (!value || this.campo() === value) return;
    this.campo.set(value);
    this.closeDrill();
    this.refresh(false);
  }

  setGroupingMode(mode: RankingGroupingMode | null | undefined): void {
    if (!this.allowTeamOrganization() || !mode || this.groupingMode() === mode) return;
    this.groupingMode.set(mode);
    this.selectedTeamId.set(null);
    this.closeDrill();
    this.refresh(false);
  }

  setSelectedTeam(idEquipo: number | null | undefined): void {
    const selected = idEquipo ?? null;
    if (this.selectedTeamId() === selected) return;
    this.selectedTeamId.set(selected);
    this.closeDrill();
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

  refresh(silent = true): void {
    this.closeDrill();
    const range = this.resolveRange();
    this.rankingSignal.set({
      requestId: ++this.requestId,
      desde: range.desde,
      hasta: range.hasta,
      modo: this.modo(),
      campo: this.campo(),
      silent,
      blocks: this.resolveBlocks()
    });
  }

  openDrill(codigoTipificacion: string, idEquipo: number | null): void {
    if (!codigoTipificacion) return;
    const range = this.resolveRange();
    this.activeDrill.set({ idEquipo, codigo: codigoTipificacion });
    this.detailSignal.set({
      requestId: ++this.detailRequestId,
      codigoTipificacion,
      idEquipo,
      desde: range.desde,
      hasta: range.hasta,
      modo: this.modo(),
      campo: this.campo()
    });
  }

  closeDrill(): void {
    if (this.activeDrill() !== null) this.activeDrill.set(null);
  }

  teamLabel(team: EquipoResponse): string {
    return team.activo ? team.nombre : `${team.nombre} (inactivo)`;
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

  private resolveRange(): RankingRange {
    const fixedRange = this.fixedRange();
    if (fixedRange) {
      return fixedRange;
    }
    const day = this.formatLocalDate(this.selectedDay());
    return { desde: day, hasta: day };
  }

  private buildTipiSegments(rows: GtrTipificacionRankingResponse[]): RankingDonutSegment[] {
    const catalog = this.catalog();
    return rows
      .map((row) => {
        const meta = catalog.get((row.codigoTipificacion ?? '').toUpperCase());
        const segment: RankingDonutSegment = {
          codigo: row.codigoTipificacion ?? '',
          label: this.display(row.codigoTipificacion),
          cantidad: row.cantidad,
          porcentaje: row.porcentaje,
          colorIndex: 0
        };
        return { segment, orden: meta?.orden ?? Number.MAX_SAFE_INTEGER };
      })
      .sort((a, b) => a.orden - b.orden || b.segment.cantidad - a.segment.cantidad)
      .map((item, index) => ({ ...item.segment, colorIndex: this.paletteFromPosition(index) }));
  }

  private buildSubtipiSegments(codigoTipi: string, rows: GtrSubtipificacionRankingResponse[]): RankingDonutSegment[] {
    const submap = this.catalog().get((codigoTipi ?? '').toUpperCase())?.subtipis;
    return rows
      .map((row, index) => {
        const meta = submap?.get((row.codigoSubtipificacion ?? '').toUpperCase());
        const segment: RankingDonutSegment = {
          codigo: row.codigoSubtipificacion ?? '',
          label: this.display(row.codigoSubtipificacion),
          cantidad: row.cantidad,
          porcentaje: row.porcentaje,
          colorIndex: 0
        };
        return { segment, orden: meta?.orden ?? Number.MAX_SAFE_INTEGER - (rows.length - index) };
      })
      .sort((a, b) => a.orden - b.orden || b.segment.cantidad - a.segment.cantidad)
      .map((item, index) => ({ ...item.segment, colorIndex: this.paletteFromPosition(index) }));
  }

  private labelForTipi(codigo: string): string {
    const meta = this.catalog().get((codigo ?? '').toUpperCase());
    return meta?.descripcion?.trim() || this.display(codigo);
  }

  private resolveBlocks(): Array<{ idEquipo: number | null; nombreEquipo: string }> {
    const fixedTeamId = this.fixedTeamId();
    if (fixedTeamId !== null) {
      const team = this.teams().find((item) => item.id === fixedTeamId);
      return [{ idEquipo: fixedTeamId, nombreEquipo: team ? this.teamLabel(team) : `Equipo ${fixedTeamId}` }];
    }
    if (!this.allowTeamOrganization() || this.groupingMode() === 'SIN_AGRUPAR') {
      return [{ idEquipo: null, nombreEquipo: 'Total general' }];
    }
    return this.visibleTeams().map((team) => ({ idEquipo: team.id, nombreEquipo: this.teamLabel(team) }));
  }

  private loadCatalog(): void {
    this.catalogLoaded = true;
    this.preventaService.getCatalogoAgregado('PREVENTA').subscribe({
      next: (catalogo) => {
        const map = new Map<string, TipiMeta>();
        for (const tipi of catalogo.tipificaciones) {
          const code = (tipi.codigo ?? '').toUpperCase();
          if (!code) continue;
          const subtipis = new Map<string, { descripcion: string; orden: number }>();
          for (const sub of tipi.subtipificaciones ?? []) {
            const subCode = (sub.codigo ?? '').toUpperCase();
            if (subCode) subtipis.set(subCode, { descripcion: sub.descripcion, orden: sub.orden });
          }
          map.set(code, { descripcion: tipi.descripcion, orden: tipi.orden, subtipis });
        }
        this.catalog.set(map);
      },
      error: () => (this.catalogLoaded = false)
    });
  }

  private loadTeams(): void {
    this.teamsLoaded = true;
    this.equipoService.listarEquipos().subscribe({
      next: (teams) => {
        this.teams.set([...teams].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        if (this.groupingMode() === 'EQUIPO') this.refresh(false);
      },
      error: () => (this.teamsLoaded = false)
    });
  }

  private paletteFromPosition(index: number): number {
    return Number.isFinite(index) && index >= 0 ? index % PALETTE_SIZE : 0;
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
