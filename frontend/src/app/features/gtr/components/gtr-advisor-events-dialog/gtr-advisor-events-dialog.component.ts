import { UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PopoverModule } from 'primeng/popover';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { GtrEventCommentPopoverComponent } from '../gtr-event-comment-popover/gtr-event-comment-popover.component';
import { GtrWorkspaceFacade } from '../../facades/gtr-workspace.facade';
import type { EventoResponse } from '../../../../shared/models/preventa/preventa.models';

@Component({
  selector: 'app-gtr-advisor-events-dialog',
  imports: [
    UpperCasePipe,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    PopoverModule,
    SelectModule,
    SkeletonModule,
    TagModule,
    TooltipModule,
    GtrEventCommentPopoverComponent
  ],
  templateUrl: './gtr-advisor-events-dialog.component.html',
  styleUrl: './gtr-advisor-events-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrAdvisorEventsDialogComponent {
  protected readonly facade = inject(GtrWorkspaceFacade);
  private organizeCloseTimeout: ReturnType<typeof setTimeout> | null = null;

  protected onOrganizeEnter(): void {
    if (this.organizeCloseTimeout !== null) {
      clearTimeout(this.organizeCloseTimeout);
      this.organizeCloseTimeout = null;
    }
  }

  protected onOrganizeLeave(popover: { hide: () => void }): void {
    this.onOrganizeEnter();
    this.organizeCloseTimeout = setTimeout(() => {
      popover.hide();
      this.organizeCloseTimeout = null;
    }, 180);
  }

  protected eventSeverity(accion?: string | null): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const a = (accion ?? '').toUpperCase();
    if (a === 'TIPIFICACION') return 'success';
    if (a === 'REGISTRO' || a === 'REGISTRO_MASIVO') return 'info';
    if (a === 'ASIGNACION' || a === 'REASIGNACION') return 'warn';
    return 'secondary';
  }

  protected advisorEventDateGroups(): Array<{ label: string; eventos: EventoResponse[] }> {
    const rows = this.facade.advisorEventDisplayRows();
    const groups = new Map<string, EventoResponse[]>();
    for (const row of rows) {
      if (row.kind !== 'event') continue;
      const label = this.dateLabel(row.event.createdAt);
      if (!groups.has(label)) {
        groups.set(label, []);
      }
      groups.get(label)!.push(row.event);
    }
    return [...groups.entries()].map(([label, eventos]) => ({ label, eventos }));
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
}
