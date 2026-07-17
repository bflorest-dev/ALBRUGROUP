import { Injectable, computed, inject, signal } from '@angular/core';
import { Subscription, firstValueFrom } from 'rxjs';
import { LeadRealtimeService } from '../../preventa/services/lead-realtime.service';
import { PreventaLeadService } from '../../preventa/services/preventa-lead.service';

@Injectable({ providedIn: 'root' })
export class GtrAgendadosAlertFacade {
  private readonly preventaService = inject(PreventaLeadService);
  private readonly realtimeService = inject(LeadRealtimeService);
  private realtimeSubscription = new Subscription();
  private clockTimerId: number | null = null;
  private started = false;
  private refreshVersion = 0;

  private readonly currentClock = signal(new Date());
  readonly totalActivos = signal(0);
  readonly programadosHoyPorHora = signal<Record<string, number>>({});
  readonly currentHour = computed(() => this.getLimaHour(this.currentClock()));
  // Programados para hoy = citas cuya fecha cae hoy (el backend ya aplica la regla de fecha).
  readonly totalProgramadosHoy = computed(() =>
    Object.values(this.programadosHoyPorHora()).reduce((sum, value) => sum + value, 0)
  );
  readonly programadosHoraActual = computed(() => this.programadosHoyPorHora()[this.currentHour()] ?? 0);
  readonly hasCurrentHourWarning = computed(() => this.programadosHoraActual() > 0);
  readonly accessibleLabel = computed(() => {
    const total = this.totalProgramadosHoy();
    const currentHourCount = this.programadosHoraActual();
    if (total === 0) {
      return 'Sin citas programadas para hoy.';
    }
    return currentHourCount > 0
      ? `${total} programados para hoy; ${currentHourCount} en esta hora.`
      : `${total} programados para hoy.`;
  });

  start(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    if (this.realtimeSubscription.closed) {
      this.realtimeSubscription = new Subscription();
    }
    this.scheduleNextClockTick();
    void this.refresh();
    this.realtimeSubscription.add(
      this.realtimeService.watchTopic('/topic/leads/etapa/PREVENTA').subscribe({
        next: (event) => {
          if (event.tipo === 'TIPIFICACION' || event.tipo === 'ELIMINACION') {
            void this.refresh();
          }
        },
        error: () => undefined
      })
    );
  }

  stop(): void {
    this.started = false;
    this.realtimeSubscription.unsubscribe();
    if (this.clockTimerId !== null) {
      window.clearTimeout(this.clockTimerId);
      this.clockTimerId = null;
    }
  }

  private async refresh(): Promise<void> {
    const version = ++this.refreshVersion;
    try {
      const summary = await firstValueFrom(this.preventaService.obtenerResumenAgendadosGtr());
      if (!this.started || version !== this.refreshVersion) {
        return;
      }
      this.totalActivos.set(summary.totalActivos);
      this.programadosHoyPorHora.set(summary.programadosHoyPorHora);
    } catch {
      // Se conserva el último resumen válido; el siguiente evento o inicio de sesión reintentará la carga.
    }
  }

  private scheduleNextClockTick(): void {
    const now = new Date();
    const elapsedInMinute = now.getSeconds() * 1_000 + now.getMilliseconds();
    const delay = 60_000 - elapsedInMinute + 50;
    this.clockTimerId = window.setTimeout(() => {
      this.currentClock.set(new Date());
      this.scheduleNextClockTick();
    }, delay);
  }

  private getLimaHour(date: Date): string {
    const hour = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      hour12: false,
      timeZone: 'America/Lima'
    }).format(date);
    return hour === '24' ? '00' : hour;
  }
}
