import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import {
  ATTENDANCE_STATUS_META,
  AttendanceActionId,
  AttendanceActionOption
} from '../../models/schedule/estado-asistencia';

@Component({
  selector: 'app-attendance-status-picker',
  imports: [ButtonModule, DialogModule, TagModule],
  templateUrl: './attendance-status-picker.component.html',
  styleUrl: './attendance-status-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttendanceStatusPickerComponent {
  @Input({ required: true }) statusLabel = 'OFFLINE';
  @Input({ required: true }) statusColor = '#8f96ad';
  @Input({ required: true }) actions: AttendanceActionOption[] = [];
  @Input({ required: true }) isLoading = false;
  @Input({ required: true }) errorMessage = '';

  @Output() readonly actionSelected = new EventEmitter<AttendanceActionId>();
  @Output() readonly retry = new EventEmitter<void>();

  protected readonly isOpen = signal(false);
  protected readonly pendingConfirmation = signal<AttendanceActionOption | null>(null);

  protected toggleOpen(): void {
    if (!this.isLoading) {
      this.isOpen.update((value) => !value);
    }
  }

  protected close(): void {
    this.isOpen.set(false);
    this.pendingConfirmation.set(null);
  }

  protected selectAction(action: AttendanceActionOption): void {
    if (action.id === 'REGISTRAR_SALIDA') {
      this.pendingConfirmation.set(action);
      return;
    }

    this.confirmAction(action.id);
  }

  protected confirmPendingAction(): void {
    const action = this.pendingConfirmation();

    if (!action) {
      return;
    }

    this.confirmAction(action.id);
  }

  protected cancelPendingAction(): void {
    this.pendingConfirmation.set(null);
  }

  protected getOptionColor(action: AttendanceActionOption): string {
    return ATTENDANCE_STATUS_META[action.targetStatus].color;
  }

  protected statusTagStyle(color = this.statusColor): Record<string, string> {
    return {
      color: '#ffffff',
      background: color,
      borderColor: color
    };
  }

  private confirmAction(actionId: AttendanceActionId): void {
    this.pendingConfirmation.set(null);
    this.isOpen.set(false);
    this.actionSelected.emit(actionId);
  }
}
