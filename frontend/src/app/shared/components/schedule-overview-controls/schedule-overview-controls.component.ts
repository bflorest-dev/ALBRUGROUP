import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-schedule-overview-controls',
  templateUrl: './schedule-overview-controls.component.html',
  styleUrl: './schedule-overview-controls.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleOverviewControlsComponent {
  readonly showChanges = input(true);
  readonly modality = input('Horario vigente');

  readonly showChangesChange = output<boolean>();
}
