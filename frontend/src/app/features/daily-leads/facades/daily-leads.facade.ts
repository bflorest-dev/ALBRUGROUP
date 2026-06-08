import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { TipificationPaletteByCode } from '../../../shared/components/tipification-stack/tipification-stack.component';
import { formatLabel } from '../../../shared/utils/display-label';
import { DailyLeadsService } from '../services/daily-leads.service';
import { DailyLeadRowView, LeadDiarioResponse } from '../models/daily-lead.model';

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
  readonly pageNumber = signal(0);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly tipificationPaletteByCode = signal<TipificationPaletteByCode>({});
  /** Fecha operativa seleccionada (YYYY-MM-DD). Vacío = hoy (lo resuelve el backend en America/Lima). */
  readonly fecha = signal('');

  readonly first = computed(() => this.pageNumber() * this.pageSize);
  readonly isToday = computed(() => this.fecha() === '');
  readonly maxDate = this.localToday();

  async initialize(): Promise<void> {
    await Promise.all([this.loadTipificationPalette(), this.load(0)]);
  }

  async setFecha(value: string): Promise<void> {
    const normalized = value || '';
    if (normalized === this.fecha()) {
      return;
    }
    this.fecha.set(normalized);
    await this.load(0);
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
    await this.load(this.pageNumber());
  }

  private async load(pageNumber: number): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const page = await firstValueFrom(
        this.service.listarRegistrosDiarios({
          fecha: this.fecha() || undefined,
          pageNumber,
          pageSize: this.pageSize
        })
      );
      this.pageNumber.set(page.page);
      this.totalElements.set(page.totalElements);
      this.rows.set(page.content.map((item) => this.toRowView(item)));
    } catch (error) {
      this.errorMessage.set(
        this.getErrorMessage(error, 'No se pudieron cargar los leads del día.')
      );
      this.rows.set([]);
      this.totalElements.set(0);
    } finally {
      this.isLoading.set(false);
    }
  }

  private toRowView(item: LeadDiarioResponse): DailyLeadRowView {
    return {
      idLead: item.idLead,
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
