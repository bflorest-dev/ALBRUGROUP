import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import {
  ATTENDANCE_STATUS_META,
  AttendanceActionId,
  AttendanceActionOption
} from '../../models/schedule/estado-asistencia';

@Component({
  selector: 'app-attendance-status-picker',
  imports: [ButtonModule, DialogModule, TagModule, TooltipModule],
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
  @Input() disabled = false;
  @Input() hint = '';
  /** Cuando hay cronometro en curso, el pill muestra el tiempo (MM:SS) en vez de la etiqueta. */
  @Input() timerText: string | null = null;
  /** El cronometro supero su tiempo estimado: el numero parpadea en rojo. */
  @Input() timerOver = false;
  /** Modal "termina tu gestion" mientras el asesor con bandeja espera para empezar su almuerzo. */
  @Input() lunchDurationMinutes: number | null = null;
  @Input() set lunchWaitVisible(value: boolean) {
    if (!value) {
      this.lunchAcknowledged.set(false);
    }
    this._lunchWaitVisible = value;
  }
  get lunchWaitVisible(): boolean {
    return this._lunchWaitVisible;
  }
  private _lunchWaitVisible = false;

  @Output() readonly actionSelected = new EventEmitter<AttendanceActionId>();
  @Output() readonly retry = new EventEmitter<void>();

  protected readonly isOpen = signal(false);
  protected readonly pendingConfirmation = signal<AttendanceActionOption | null>(null);
  private readonly lunchAcknowledged = signal(false);

  protected readonly showLunchWait = computed(() => this._lunchWaitVisible && !this.lunchAcknowledged());
  protected readonly lunchDurationLabel = computed(() => {
    const minutes = this.lunchDurationMinutes;
    if (minutes == null) return 'tu tiempo de almuerzo';
    if (minutes === 60) return '1 hora';
    return `${minutes} minutos`;
  });

  protected toggleOpen(): void {
    if (!this.isLoading && !this.disabled) {
      this.isOpen.update((value) => !value);
    }
  }

  protected close(): void {
    this.isOpen.set(false);
    this.pendingConfirmation.set(null);
  }

  protected selectAction(action: AttendanceActionOption): void {
    if (this.disabled || !action.enabled || !action.actionId) {
      return;
    }

    if (action.actionId === 'REGISTRAR_SALIDA') {
      this.pendingConfirmation.set(action);
      return;
    }

    this.confirmAction(action.actionId);
  }

  protected confirmPendingAction(): void {
    const action = this.pendingConfirmation();

    if (!action?.actionId) {
      return;
    }

    this.confirmAction(action.actionId);
  }

  protected cancelPendingAction(): void {
    this.pendingConfirmation.set(null);
  }

  protected acknowledgeLunch(): void {
    this.lunchAcknowledged.set(true);
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
    if (this.disabled) {
      return;
    }

    this.pendingConfirmation.set(null);
    this.isOpen.set(false);
    this.actionSelected.emit(actionId);
  }
}
