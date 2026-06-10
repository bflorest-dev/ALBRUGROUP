import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { TipificationPaletteByCode } from '../../../shared/components/tipification-stack/tipification-stack.component';
import { EventoResponse } from '../../../shared/models/preventa/preventa.models';
import { formatLabel } from '../../../shared/utils/display-label';
import { DailyLeadsService } from '../services/daily-leads.service';
import {
  DailyLeadGroupFilter,
  DailyLeadGroupItem,
  DailyLeadGroupMode,
  DailyLeadGroupsResponse,
  DailyLeadRowView,
  LeadDiarioResponse
} from '../models/daily-lead.model';

@Injectable()
export class DailyLeadsFacade {
  private readonly service = inject(DailyLeadsService);

  private readonly timeFormatter = new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit'
  });

  readonly pageSize = 10;

  readonly rows = signal<DailyLeadRowView[]>([]);
  readonly totalElements = signal(0);
  readonly visibleTotalElements = signal(0);
  readonly pageNumber = signal(0);
  readonly isLoading = signal(false);
  readonly isLoadingGroups = signal(false);
  readonly isLoadingEvents = signal(false);
  readonly errorMessage = signal('');
  readonly tipificationPaletteByCode = signal<TipificationPaletteByCode>({});
  readonly eventRows = signal<EventoResponse[]>([]);
  readonly activeHistoryLead = signal<DailyLeadRowView | null>(null);
  /** Fecha operativa seleccionada (YYYY-MM-DD). Vacío = hoy (lo resuelve el backend en America/Lima). */
  readonly fecha = signal('');
  readonly groupingMode = signal<DailyLeadGroupMode>('SIN_AGRUPAR');
  readonly selectedGroup = signal<DailyLeadGroupItem | null>(null);
  readonly groups = signal<DailyLeadGroupsResponse>({
    asesores: [],
    campanas: [],
    primerasTipificaciones: [],
    ultimasTipificaciones: []
  });

  readonly first = computed(() => this.pageNumber() * this.pageSize);
  readonly isToday = computed(() => this.fecha() === '');
  readonly groupingModeOptions: Array<{ label: string; value: DailyLeadGroupMode }> = [
    { label: 'Sin agrupar', value: 'SIN_AGRUPAR' },
    { label: 'Asesor', value: 'ASESOR' },
    { label: 'Campaña', value: 'CAMPANA' },
    { label: 'Primera tipificación', value: 'PRIMERA_TIPIFICACION' },
    { label: 'Última tipificación', value: 'ULTIMA_TIPIFICACION' }
  ];
  readonly activeGroupOptions = computed<DailyLeadGroupItem[]>(() => {
    const groups = this.groups();
    switch (this.groupingMode()) {
      case 'ASESOR':
        return groups.asesores;
      case 'CAMPANA':
        return groups.campanas;
      case 'PRIMERA_TIPIFICACION':
        return groups.primerasTipificaciones;
      case 'ULTIMA_TIPIFICACION':
        return groups.ultimasTipificaciones;
      default:
        return [];
    }
  });
  readonly maxDate = this.localToday();

  async initialize(): Promise<void> {
    await Promise.all([
      this.loadTipificationPalette(),
      this.loadGroups(),
      this.load(0)
    ]);
  }

  async setFecha(value: string): Promise<void> {
    const normalized = value || '';
    if (normalized === this.fecha()) {
      return;
    }
    this.fecha.set(normalized);
    await Promise.all([this.loadGroups(), this.load(0)]);
  }

  async showToday(): Promise<void> {
    await this.setFecha('');
  }

  async changePage(pageNumber: number): Promise<void> {
    if (pageNumber === this.pageNumber()) {
      return;
    }
    await this.load(pageNumber);
  }

  async refresh(): Promise<void> {
    await Promise.all([this.loadGroups(), this.load(this.pageNumber())]);
  }

  async setGroupingMode(mode: DailyLeadGroupMode | null | undefined): Promise<void> {
    if (!mode || mode === this.groupingMode()) {
      return;
    }
    this.groupingMode.set(mode);
    this.selectedGroup.set(null);
    await this.load(0);
  }

  async toggleGroup(group: DailyLeadGroupItem): Promise<void> {
    const selected = this.selectedGroup();
    this.selectedGroup.set(
      selected && this.groupKey(selected) === this.groupKey(group) ? null : group
    );
    await this.load(0);
  }

  isGroupSelected(group: DailyLeadGroupItem): boolean {
    const selected = this.selectedGroup();
    return !!selected && this.groupKey(selected) === this.groupKey(group);
  }

  groupKey(group: DailyLeadGroupItem): string {
    if (group.sinValor) {
      return `${this.groupingMode()}:SIN_VALOR`;
    }
    if (group.idGrupo !== null && group.idGrupo !== undefined) {
      return `${this.groupingMode()}:ID:${group.idGrupo}`;
    }
    return `${this.groupingMode()}:TIP:${group.codigoTipificacion ?? ''}:SUB:${group.codigoSubtipificacion ?? ''}`;
  }

  async openEventHistory(row: DailyLeadRowView): Promise<void> {
    this.activeHistoryLead.set(row);
    this.eventRows.set([]);
    this.isLoadingEvents.set(true);
    this.errorMessage.set('');
    try {
      const page = await firstValueFrom(
        this.service.listarEventosLead(row.idLead, this.selectedHistoryDate(), {
          pageNumber: 0,
          pageSize: 100,
          sortBy: 'createdAt',
          direction: 'desc'
        })
      );
      this.eventRows.set(page.content);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo cargar el historial de eventos.'));
    } finally {
      this.isLoadingEvents.set(false);
    }
  }

  closeEventHistory(): void {
    this.activeHistoryLead.set(null);
    this.eventRows.set([]);
    this.isLoadingEvents.set(false);
  }

  eventSummary(evento: EventoResponse): string {
    const accion = (evento.accion ?? '').toUpperCase();
    const tipificacion = evento.tipificacion?.trim() || null;
    const subtipificacion = evento.subtipificacion?.trim() || null;
    const tipParts = [tipificacion, subtipificacion].filter(Boolean);

    if (accion === 'TIPIFICACION') {
      return tipParts.length ? tipParts.join(' / ') : '-';
    }

    if (tipParts.length) {
      return tipParts.join(' / ');
    }

    if (accion === 'REGISTRO' || accion === 'REGISTRO_MASIVO') {
      return this.activeHistoryLead()?.campana ?? '-';
    }

    return '-';
  }

  display(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return String(value);
  }

  private async load(pageNumber: number): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const page = await firstValueFrom(
        this.service.listarRegistrosDiarios({
          fecha: this.fecha() || undefined,
          pageNumber,
          pageSize: this.pageSize,
          filters: this.currentGroupFilter()
        })
      );
      this.pageNumber.set(page.page);
      this.visibleTotalElements.set(page.totalElements);
      if (!this.selectedGroup()) {
        this.totalElements.set(page.totalElements);
      }
      this.rows.set(page.content.map((item) => this.toRowView(item)));
    } catch (error) {
      this.errorMessage.set(
        this.getErrorMessage(error, 'No se pudieron cargar los leads del día.')
      );
      this.rows.set([]);
      this.visibleTotalElements.set(0);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadGroups(): Promise<void> {
    this.isLoadingGroups.set(true);
    try {
      const groups = await firstValueFrom(
        this.service.listarAgrupacionesRegistrosDiarios(this.fecha() || undefined)
      );
      this.groups.set(groups);
      this.totalElements.set(groups.asesores.reduce((total, group) => total + group.cantidad, 0));
    } catch (error) {
      this.errorMessage.set(
        this.getErrorMessage(error, 'No se pudieron actualizar las agrupaciones.')
      );
    } finally {
      this.isLoadingGroups.set(false);
    }
  }

  private currentGroupFilter(): DailyLeadGroupFilter {
    const mode = this.groupingMode();
    const group = this.selectedGroup();
    if (mode === 'SIN_AGRUPAR' || !group) {
      return {};
    }

    const filter: DailyLeadGroupFilter = {
      tipoGrupo: mode,
      sinValor: group.sinValor
    };
    if (group.idGrupo !== null && group.idGrupo !== undefined) {
      filter.idGrupo = group.idGrupo;
    }
    if (group.codigoTipificacion) {
      filter.codigoTipificacion = group.codigoTipificacion;
    }
    if (group.codigoSubtipificacion) {
      filter.codigoSubtipificacion = group.codigoSubtipificacion;
    }
    return filter;
  }

  private toRowView(item: LeadDiarioResponse): DailyLeadRowView {
    return {
      idLead: item.idLead,
      prefijo: item.prefijo,
      lead: item.lead,
      leadDisplay: this.formatLead(item.prefijo, item.lead),
      asesor: item.nombreActor?.trim() || '-',
      rolLabel: formatLabel(item.rolActor),
      accionLabel: formatLabel(item.accion),
      hora: this.formatTime(item.createdAt),
      campana: item.nombreCampana?.trim() || '-',
      primeraCodigoTipificacion: item.primeraCodigoTipificacion,
      primeraCodigoSubtipificacion: item.primeraCodigoSubtipificacion,
      codigoTipificacion: item.codigoTipificacion,
      codigoSubtipificacion: item.codigoSubtipificacion
    };
  }

  private formatLead(prefijo: string | null, lead: string | null): string {
    const numero = lead?.trim() ?? '';
    const codigo = prefijo?.trim() ?? '';
    if (!numero) {
      return '-';
    }
    return codigo ? `${codigo} ${numero}` : numero;
  }

  private formatTime(value: string): string {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }
    return this.timeFormatter.format(date);
  }

  private async loadTipificationPalette(): Promise<void> {
    try {
      const catalogs = await Promise.all([
        firstValueFrom(this.service.getCatalogoTipificaciones('PREVENTA')),
        firstValueFrom(this.service.getCatalogoTipificaciones('VENTA')),
        firstValueFrom(this.service.getCatalogoTipificaciones('POSTVENTA'))
      ]);
      const paletteByCode: TipificationPaletteByCode = {};

      for (const catalog of catalogs) {
        for (const tipificacion of catalog.tipificaciones ?? []) {
          paletteByCode[tipificacion.codigo.toUpperCase()] = this.tipificacionPaletteIndex(tipificacion.orden);
        }
      }

      this.tipificationPaletteByCode.set(paletteByCode);
    } catch {
      this.tipificationPaletteByCode.set({});
    }
  }

  private tipificacionPaletteIndex(orden: number): number {
    const totalPalettes = 8;
    if (!Number.isFinite(orden) || orden <= 0) {
      return 0;
    }
    return (orden - 1) % totalPalettes;
  }

  private selectedHistoryDate(): string {
    return this.fecha() || this.localToday();
  }

  private localToday(): string {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const message = (error.error as { message?: string } | null)?.message;
      if (message) {
        return message;
      }
      if (error.status === 403) {
        return 'No tienes acceso a esta información.';
      }
    }
    return fallback;
  }
}
