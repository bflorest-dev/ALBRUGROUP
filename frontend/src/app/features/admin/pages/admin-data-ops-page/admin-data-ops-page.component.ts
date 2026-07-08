import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { AdminMetricsBackfillService, MetricsBackfillEstado } from '../../services/admin-metrics-backfill.service';

/**
 * Tab ADMIN aislada para operaciones de datos puntuales (one-off). Hoy solo hospeda el backfill de
 * métricas por etapa (LeadEtapaResumen). Pensada para poder quitarse sin afectar el resto del panel.
 */
@Component({
  selector: 'app-admin-data-ops-page',
  imports: [ButtonModule, CardModule, DialogModule, MessageModule, TagModule],
  templateUrl: './admin-data-ops-page.component.html',
  styleUrl: './admin-data-ops-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDataOpsPageComponent implements OnInit, OnDestroy {
  private readonly backfillService = inject(AdminMetricsBackfillService);

  protected readonly estado = signal<MetricsBackfillEstado | null>(null);
  protected readonly isStarting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly confirmVisible = signal(false);
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
      return `Completado (${estado.procesados} leads procesados)`;
    }
    return 'Sin ejecuciones registradas';
  });

  ngOnInit(): void {
    void this.refrescarEstado();
  }

  ngOnDestroy(): void {
    this.detenerPoll();
  }

  protected pedirConfirmacion(): void {
    this.errorMessage.set('');
    this.confirmVisible.set(true);
  }

  protected cancelar(): void {
    this.confirmVisible.set(false);
  }

  protected async ejecutar(): Promise<void> {
    this.confirmVisible.set(false);
    this.isStarting.set(true);
    this.errorMessage.set('');
    try {
      this.estado.set(await firstValueFrom(this.backfillService.iniciar()));
      this.iniciarPoll();
    } catch {
      this.errorMessage.set('No se pudo iniciar la reconstrucción. Intenta de nuevo.');
    } finally {
      this.isStarting.set(false);
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
