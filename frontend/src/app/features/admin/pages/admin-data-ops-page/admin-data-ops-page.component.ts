import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { AdminMetricsBackfillService, MetricsBackfillEstado } from '../../services/admin-metrics-backfill.service';

/**
 * Tab ADMIN aislada para operaciones de datos puntuales (one-off). Hoy solo hospeda el backfill de
 * métricas por etapa (LeadEtapaResumen). Pensada para poder quitarse sin afectar el resto del panel.
 */
@Component({
  selector: 'app-admin-data-ops-page',
  imports: [ButtonModule, CardModule, DialogModule, FormsModule, InputTextModule, MessageModule, ProgressBarModule, TagModule],
  templateUrl: './admin-data-ops-page.component.html',
  styleUrl: './admin-data-ops-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDataOpsPageComponent implements OnInit, OnDestroy {
  private readonly backfillService = inject(AdminMetricsBackfillService);

  protected readonly estado = signal<MetricsBackfillEstado | null>(null);
  protected readonly isStarting = signal(false);
  protected readonly isRunningSingle = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly confirmVisible = signal(false);
  protected readonly leadDraft = signal('');
  private pollHandle: ReturnType<typeof setInterval> | null = null;

  protected readonly enEjecucion = computed(() => this.estado()?.enEjecucion ?? false);
  protected readonly progresoLabel = computed(() => {
    const estado = this.estado();
    if (!estado) {
      return '';
    }
    if (estado.enEjecucion) {
      return `En ejecución (${estado.procesados} / ${estado.total})`;
    }
    if (estado.finalizadoEn) {
      return `Completado (${estado.procesados} leads procesados${estado.fallidos ? `, ${estado.fallidos} con error` : ''})`;
    }
    return 'Sin ejecuciones registradas';
  });
  protected readonly progreso = computed(() => {
    const estado = this.estado();
    if (!estado?.total) {
      return 0;
    }
    return Math.min(100, Math.round((estado.procesados / estado.total) * 100));
  });

  ngOnInit(): void {
    void this.refrescarEstado();
  }

  ngOnDestroy(): void {
    this.detenerPoll();
  }

  protected pedirConfirmacion(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.confirmVisible.set(true);
  }

  protected cancelar(): void {
    this.confirmVisible.set(false);
  }

  protected async ejecutar(): Promise<void> {
    this.confirmVisible.set(false);
    this.isStarting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    try {
      this.estado.set(await firstValueFrom(this.backfillService.iniciar()));
      this.iniciarPoll();
    } catch {
      this.errorMessage.set('No se pudo iniciar la reconstrucción. Intenta de nuevo.');
    } finally {
      this.isStarting.set(false);
    }
  }

  protected onLeadDraftChange(value: string): void {
    this.leadDraft.set((value ?? '').replace(/\s+/g, '').replace(/\D/g, ''));
  }

  protected async recalcularLead(): Promise<void> {
    const lead = this.leadDraft().trim();
    if (!lead) {
      this.errorMessage.set('Ingresa el numero de lead.');
      return;
    }
    this.isRunningSingle.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    try {
      await firstValueFrom(this.backfillService.recalcularLead(lead));
      this.successMessage.set(`Resumen recalculado para el lead ${lead}.`);
      await this.refrescarEstado();
    } catch {
      this.errorMessage.set('No se pudo recalcular ese lead. Verifica el numero e intenta nuevamente.');
    } finally {
      this.isRunningSingle.set(false);
    }
  }

  private async refrescarEstado(): Promise<void> {
    try {
      const estado = await firstValueFrom(this.backfillService.estado());
      this.estado.set(estado);
      if (estado.enEjecucion) {
        this.iniciarPoll();
      }
    } catch {
      // Estado opcional: si falla la consulta inicial, el botón sigue disponible.
    }
  }

  private iniciarPoll(): void {
    if (this.pollHandle) {
      return;
    }
    this.pollHandle = setInterval(async () => {
      try {
        const estado = await firstValueFrom(this.backfillService.estado());
        this.estado.set(estado);
        if (!estado.enEjecucion) {
          this.detenerPoll();
        }
      } catch {
        this.detenerPoll();
      }
    }, 3000);
  }

  private detenerPoll(): void {
    if (this.pollHandle) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
  }
}
