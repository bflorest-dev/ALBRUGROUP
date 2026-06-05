import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { formatLabel } from '../../../shared/utils/display-label';
import { DailyLeadsService } from '../services/daily-leads.service';
import { DailyLeadRowView, LeadDiarioResponse } from '../models/daily-lead.model';

@Injectable()
export class DailyLeadsFacade {
  private readonly service = inject(DailyLeadsService);

  private readonly dateTimeFormatter = new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  readonly pageSize = 10;

  readonly rows = signal<DailyLeadRowView[]>([]);
  readonly totalElements = signal(0);
  readonly pageNumber = signal(0);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  /** Fecha operativa seleccionada (YYYY-MM-DD). Vacío = hoy (lo resuelve el backend en America/Lima). */
  readonly fecha = signal('');

  readonly first = computed(() => this.pageNumber() * this.pageSize);
  readonly isToday = computed(() => this.fecha() === '');
  readonly maxDate = this.localToday();

  async initialize(): Promise<void> {
    await this.load(0);
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
      fechaHora: this.formatDateTime(item.createdAt)
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

  private formatDateTime(value: string): string {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }
    return this.dateTimeFormatter.format(date);
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
