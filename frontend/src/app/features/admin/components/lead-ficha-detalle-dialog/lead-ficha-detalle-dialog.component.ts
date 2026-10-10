import { ChangeDetectionStrategy, Component, computed, inject, model, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { LeadFichaDetalleService, LeadFichaDetalle, ActorMomento } from '../../services/lead-ficha-detalle.service';

type EtapaOption = 'PREVENTA' | 'VENTA' | 'POSTVENTA';

const ETAPA_OPTIONS: { label: string; value: EtapaOption }[] = [
  { label: 'Preventa', value: 'PREVENTA' },
  { label: 'Venta', value: 'VENTA' },
  { label: 'Postventa', value: 'POSTVENTA' }
];

const DATE_FMT = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'America/Lima'
});

const TIME_FMT = new Intl.DateTimeFormat('es-PE', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'America/Lima'
});

@Component({
  selector: 'app-lead-ficha-detalle-dialog',
  imports: [DialogModule, SelectButtonModule, FormsModule, ProgressSpinnerModule],
  templateUrl: './lead-ficha-detalle-dialog.component.html',
  styleUrl: './lead-ficha-detalle-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeadFichaDetalleDialogComponent {
  private readonly service = inject(LeadFichaDetalleService);

  readonly visible = model(false);
  readonly leadLabel = signal('');

  protected readonly etapaOptions = ETAPA_OPTIONS;
  protected readonly etapa = signal<EtapaOption>('PREVENTA');
  protected readonly loading = signal(false);
  protected readonly error = signal(false);
  protected readonly data = signal<LeadFichaDetalle | null>(null);

  private readonly currentIdLead = signal<number | null>(null);

  protected readonly quien = computed(() => this.data()?.quien ?? null);
  protected readonly cuando = computed(() => this.data()?.cuando ?? null);

  async abrir(idLead: number, label: string, etapa: EtapaOption = 'PREVENTA'): Promise<void> {
    this.currentIdLead.set(idLead);
    this.leadLabel.set(label);
    this.etapa.set(etapa);
    this.visible.set(true);
    await this.cargar(idLead, etapa);
  }

  protected async onEtapaChange(nuevaEtapa: EtapaOption): Promise<void> {
    this.etapa.set(nuevaEtapa);
    const id = this.currentIdLead();
    if (id) {
      await this.cargar(id, nuevaEtapa);
    }
  }

  private async cargar(idLead: number, etapa: string): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      const result = await firstValueFrom(this.service.obtener(idLead, etapa));
      this.data.set(result);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  protected formatInstant(value: string | null | undefined): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return `${DATE_FMT.format(d)} · ${TIME_FMT.format(d)}`;
  }

  protected formatDate(value: string | null | undefined): string {
    if (!value) return '';
    const parts = value.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return DATE_FMT.format(d);
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return DATE_FMT.format(d);
  }

  protected actorNombre(actor: ActorMomento | null | undefined): string {
    return actor?.nombre ?? '—';
  }

  protected actorFecha(actor: ActorMomento | null | undefined): string {
    return this.formatInstant(actor?.fecha);
  }
}
