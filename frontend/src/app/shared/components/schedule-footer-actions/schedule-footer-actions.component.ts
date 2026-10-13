import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-schedule-footer-actions',
  templateUrl: './schedule-footer-actions.component.html',
  styleUrl: './schedule-footer-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleFooterActionsComponent {
  readonly canReprogram = input(false);
  readonly canAdd = input(false);

  readonly reprogramRequested = output<void>();
  readonly addRequested = output<void>();
}
