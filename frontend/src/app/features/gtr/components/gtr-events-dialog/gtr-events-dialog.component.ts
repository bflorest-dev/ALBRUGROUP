import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { GtrEventCommentPopoverComponent } from '../gtr-event-comment-popover/gtr-event-comment-popover.component';
import { GtrWorkspaceFacade } from '../../facades/gtr-workspace.facade';
import { LeadEventHistoryComponent } from '../../../../shared/components/lead-event-history/lead-event-history.component';
import { EventoResponse } from '../../../../shared/models/preventa/preventa.models';

@Component({
  selector: 'app-gtr-events-dialog',
  imports: [
    DatePipe,
    UpperCasePipe,
    ButtonModule,
    DialogModule,
    SkeletonModule,
    TableModule,
    GtrEventCommentPopoverComponent,
    LeadEventHistoryComponent
  ],
  templateUrl: './gtr-events-dialog.component.html',
  styleUrl: './gtr-events-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrEventsDialogComponent {
  protected readonly facade = inject(GtrWorkspaceFacade);
  protected readonly eventSummary = (e: EventoResponse) => this.facade.eventSummary(e);
  protected readonly activeEventFilter = signal<string | null>(null);

  protected readonly eventFilterOptions = computed(() => {
    const typeMap: Record<string, string> = {
      TIPIFICACION: 'tipificacion', REGISTRO: 'registro',
      REGISTRO_MASIVO: 'registro', ASIGNACION: 'asignacion', CONTACTO: 'contacto',
    };
    const seen = new Set<string>();
    for (const e of this.facade.filteredEventRows()) {
      seen.add(typeMap[(e.accion ?? '').toUpperCase()] ?? 'default');
    }
    return [...seen];
  });

  protected readonly eventFilterLabels: Partial<Record<string, string>> = {
    tipificacion: 'Tipificación', registro: 'Registro',
    asignacion: 'Asignación', contacto: 'Contacto',
  };

  constructor() {
    effect(() => {
      this.facade.leadHistoryMode();
      this.activeEventFilter.set(null);
    });
  }

  protected truncateAdvisor(name: string | null | undefined): string {
    if (!name?.trim()) return '-';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 3 ? `${parts[0]} ${parts[2]}` : name;
  }
}
