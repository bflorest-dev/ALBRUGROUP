import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { EventoResponse } from '../../models/preventa/preventa.models';

@Component({
  selector: 'app-lead-event-history',
  imports: [DatePipe, SkeletonModule, TooltipModule],
  templateUrl: './lead-event-history.component.html',
  styleUrl: './lead-event-history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeadEventHistoryComponent {
  readonly events = input.required<EventoResponse[]>();
  readonly loading = input<boolean>(false);
  readonly emptyMessage = input<string>('No hay eventos para el día.');
  readonly summarize = input<((e: EventoResponse) => string) | null>(null);

  protected readonly skeletonRows = [1, 2, 3, 4];
  protected readonly selectedFilter = signal<string | null>(null);

  protected readonly uniqueEventTypes = computed(() => {
    const seen = new Set<string>();
    for (const e of this.events()) {
      seen.add(this.eventType(e.accion));
    }
    return [...seen];
  });

  protected readonly filteredEvents = computed(() => {
    const filter = this.selectedFilter();
    if (!filter) return this.events();
    return this.events().filter(e => this.eventType(e.accion) === filter);
  });

  protected toggleFilter(type: string | null): void {
    this.selectedFilter.set(this.selectedFilter() === type ? null : type);
  }

  protected summary(evento: EventoResponse): string {
    const fn = this.summarize();
    if (fn) return fn(evento);
    return this.defaultSummary(evento);
  }

  private defaultSummary(evento: EventoResponse): string {
    const accion = (evento.accion ?? '').toUpperCase();
    const tipificacion = evento.tipificacion?.trim() || null;
    const subtipificacion = evento.subtipificacion?.trim() || null;
    const tipParts = [tipificacion, subtipificacion].filter(Boolean);

    if (accion === 'TIPIFICACION') return tipParts.length ? tipParts.join(' / ') : '-';
    if (accion === 'ASIGNACION') return evento.nombreAsesorAsignado?.trim() || '-';
    if (tipParts.length) return tipParts.join(' / ');
    if ((accion === 'REGISTRO' || accion === 'REGISTRO_MASIVO') && evento.idCampana) return `Campaña ${evento.idCampana}`;
    return '-';
  }

  protected detailLabel(accion: string | null | undefined): string | null {
    switch ((accion ?? '').toUpperCase()) {
      case 'ASIGNACION': return 'Asignado a';
      case 'REGISTRO':
      case 'REGISTRO_MASIVO':
      case 'CONTACTO': return 'Campaña';
      default: return null;
    }
  }

  protected actorName(evento: EventoResponse): string {
    const name = evento.nombreActor?.trim();
    return name ? name.toUpperCase() : '-';
  }

  protected hasComment(evento: EventoResponse): boolean {
    return !!evento.comentario?.trim();
  }

  protected eventType(accion: string | null | undefined): string {
    switch ((accion ?? '').toUpperCase()) {
      case 'TIPIFICACION': return 'tipificacion';
      case 'REGISTRO':
      case 'REGISTRO_MASIVO': return 'registro';
      case 'ASIGNACION': return 'asignacion';
      case 'CONTACTO': return 'contacto';
      default: return 'default';
    }
  }

  protected eventLabel(accion: string | null | undefined): string {
    const val = (accion ?? '').replace(/_/g, ' ');
    return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
  }
}
