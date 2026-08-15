import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { GtrWorkspaceFacade } from '../../facades/gtr-workspace.facade';
import { AjusteJornadaRequest } from '../../../../shared/models/schedule/jornada-efectiva-response';
import { ScheduleExtensionTimelineComponent } from '../../../../shared/components/schedule-extension-timeline/schedule-extension-timeline.component';

/**
 * Modal de horas extra del GTR: wrapper delgado del timeline compartido
 * ({@link ScheduleExtensionTimelineComponent}). Solo mapea el facade del GTR a los inputs/outputs.
 */
@Component({
  selector: 'app-gtr-schedule-extension-dialog',
  imports: [DialogModule, ScheduleExtensionTimelineComponent],
  templateUrl: './gtr-schedule-extension-dialog.component.html',
  styleUrl: './gtr-schedule-extension-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrScheduleExtensionDialogComponent {
  protected readonly facade = inject(GtrWorkspaceFacade);
  protected readonly visible = computed(() => this.facade.activeDialog() === 'schedule-extension');

  protected close(): void {
    this.facade.closeScheduleExtension();
  }

  protected onSave(requests: AjusteJornadaRequest[]): void {
    void this.facade.submitScheduleExtension(requests);
  }
}
