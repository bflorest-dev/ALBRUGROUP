import { UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { GtrEventCommentPopoverComponent } from '../gtr-event-comment-popover/gtr-event-comment-popover.component';
import { GtrWorkspaceFacade } from '../../facades/gtr-workspace.facade';
import type { EventoResponse } from '../../../../shared/models/preventa/preventa.models';

@Component({
  selector: 'app-gtr-events-dialog',
  imports: [
    UpperCasePipe,
    FormsModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    SkeletonModule,
    TabsModule,
    TagModule,
    TooltipModule,
    GtrEventCommentPopoverComponent
  ],
  templateUrl: './gtr-events-dialog.component.html',
  styleUrl: './gtr-events-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrEventsDialogComponent {
  protected readonly facade = inject(GtrWorkspaceFacade);

  protected readonly selectedTipificacionFilter = signal('');

  protected readonly selectedSubtipificacionFilter = signal('');

  protected readonly selectedAdvisorFilter = signal('');

  protected readonly eventosDiaCount = computed(() => this.facade.filteredEventRows().length);

  protected readonly historialEventCount = computed(() => this.facade.tipificationHistoryRows().length);

  protected readonly tipificacionSelectOptions = computed(() => {
    const options = this.facade.catalogoTipificaciones().map((t) => ({
      label: t.codigo,
      value: t.codigo
    }));
    return [{ label: 'Todos', value: '' }, ...options];
  });

  protected readonly subtipificacionSelectOptions = computed(() => {
    const selected = this.selectedTipificacionFilter();
    let filtered = this.facade.catalogoSubtipificaciones();
    if (selected) {
      filtered = filtered.filter((s) => s.codigoTipificacion === selected);
    }
    const options = filtered.map((s) => ({
      label: s.codigo,
      value: s.codigo
    }));
    return [{ label: 'Todos', value: '' }, ...options];
  });

  protected readonly filteredHistorialRows = computed(() => {
    const rows = this.facade.tipificationHistoryRows();
    const tip = this.selectedTipificacionFilter();
    const sub = this.selectedSubtipificacionFilter();
    const adv = this.selectedAdvisorFilter();

    return rows.filter((evento) => {
      if (tip && (evento.tipificacion ?? '').toUpperCase() !== tip.toUpperCase()) {
        return false;
      }
      if (sub && (evento.subtipificacion ?? '').toUpperCase() !== sub.toUpperCase()) {
        return false;
      }
      if (adv && this.facade.tipificationHistoryAdvisor(evento).toUpperCase() !== adv) {
        return false;
      }
      return true;
    });
  });

  protected onTipificacionFilterChange(value: string): void {
    this.selectedTipificacionFilter.set(value || '');
    this.selectedSubtipificacionFilter.set('');
  }

  protected readonly advisorSelectOptions = computed(() => {
    const counts = new Map<string, number>();
    for (const e of this.facade.tipificationHistoryRows()) {
      const advisor = this.facade.tipificationHistoryAdvisor(e);
      counts.set(advisor, (counts.get(advisor) ?? 0) + 1);
    }
    const options = [...counts.entries()]
      .map(([value, count]) => ({ label: `${value} (${count})`, value: value.toUpperCase() }))
      .sort((a, b) => counts.get(b.value)! - counts.get(a.value)! || a.label.localeCompare(b.label));
    return [{ label: 'Todos', value: '' }, ...options];
  });

  protected readonly advisorSelectedLabel = computed(() => {
    const selected = this.selectedAdvisorFilter();
    if (!selected) return '';
    const option = this.advisorSelectOptions().find((o) => o.value === selected);
    return option?.label ?? selected;
  });

  protected eventCampaign(): string | null {
    const rows = this.facade.eventRows();
    if (!rows.length) {
      return null;
    }
    for (const event of rows) {
      if (event.idCampana) {
        const campana = this.facade.campanas().find((c) => c.id === event.idCampana);
        if (campana?.nombre) {
          return campana.nombre;
        }
      }
    }
    return null;
  }

  protected eventSeverity(accion?: string | null): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const a = (accion ?? '').toUpperCase();
    if (a === 'TIPIFICACION') return 'success';
    if (a === 'REGISTRO' || a === 'REGISTRO_MASIVO') return 'info';
    if (a === 'ASIGNACION' || a === 'REASIGNACION') return 'warn';
    return 'secondary';
  }

  protected timeGroup(iso?: string | null): string {
    if (!iso) return '';
    const h = new Date(iso).getHours();
    if (h < 12) return 'Mañana';
    if (h < 18) return 'Tarde';
    return 'Noche';
  }

  protected eventTimeDisplay(iso?: string | null): string {
    if (!iso) return '-';
    const date = new Date(iso);
    return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  }

  protected relativeTime(iso?: string | null): string {
    if (!iso) return '-';
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;

    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `Hace ${diffHrs}h`;

    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} d`;

    return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
  }

  protected dateLabel(iso?: string | null): string {
    if (!iso) return '';
    const date = new Date(iso);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((today.getTime() - eventDay.getTime()) / 86400000);
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  protected dateGroups(rows: EventoResponse[]): Array<{ label: string; eventos: EventoResponse[] }> {
    const groups = new Map<string, EventoResponse[]>();
    for (const event of rows) {
      const label = this.dateLabel(event.createdAt);
      if (!groups.has(label)) {
        groups.set(label, []);
      }
      groups.get(label)!.push(event);
    }
    return [...groups.entries()].map(([label, eventos]) => ({ label, eventos }));
  }

  protected onTabChange(value: string | number | undefined): void {
    void this.facade.setLeadHistoryMode(String(value) as 'eventos-dia' | 'historial');
  }

  protected isAnomaly(evento: EventoResponse): boolean {
    const filter = this.facade.selectedEventAnomalyFilter();
    if (!filter) return false;
    return evento.accion === 'REGISTRO';
  }
}
