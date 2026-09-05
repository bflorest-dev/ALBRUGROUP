import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import {
  ATTENDANCE_STATUS_META,
  AttendanceActionId,
  AttendanceActionOption
} from '../../../shared/models/schedule/estado-asistencia';
import { TramoDiaVm } from '../../../shared/models/schedule/detalle-dia-response';

@Component({
  selector: 'app-sidebar-attendance-picker',
  imports: [ButtonModule, DialogModule],
  templateUrl: './sidebar-attendance-picker.component.html',
  styleUrl: './sidebar-attendance-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarAttendancePickerComponent {
  readonly statusLabel = input('OFFLINE');
  readonly statusColor = input('#8f96ad');
  readonly actions = input<AttendanceActionOption[]>([]);
  readonly isLoading = input(false);
  readonly errorMessage = input('');
  readonly disabled = input(false);
  readonly hint = input('');
  readonly tramos = input<TramoDiaVm[]>([]);
  readonly timerText = input<string | null>(null);
  readonly timerOver = input(false);
  readonly lunchWaitVisible = input(false);
  readonly lunchDurationMinutes = input<number | null>(null);

  readonly actionSelected = output<AttendanceActionId>();
  readonly retry = output<void>();

  protected readonly isOpen = signal(false);
  protected readonly pendingConfirmation = signal<AttendanceActionOption | null>(null);
  private readonly lunchAcknowledged = signal(false);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly showLunchWait = computed(() => this.lunchWaitVisible() && !this.lunchAcknowledged());
  protected readonly lunchDurationLabel = computed(() => {
    const minutes = this.lunchDurationMinutes();
    if (minutes == null) return 'tu tiempo de almuerzo';
    if (minutes === 60) return '1 hora';
    return `${minutes} minutos`;
  });

  constructor() {
    effect(() => {
      if (!this.lunchWaitVisible()) {
        this.lunchAcknowledged.set(false);
      }
    });
  }

  @HostListener('document:pointerdown', ['$event'])
  protected closeOnOutsidePointer(event: PointerEvent): void {
    if (this.isOpen() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  protected closeOnEscape(): void {
    this.close();
  }

  open(focusFirstAction = false): void {
    if (this.disabled() || this.isLoading()) return;
    this.isOpen.set(true);

    if (focusFirstAction) {
      window.setTimeout(() => {
        this.host.nativeElement
          .querySelector<HTMLElement>('.sidebar-attendance__option:not(:disabled)')
          ?.focus({ preventScroll: true });
      });
    }
  }

  close(): void {
    this.isOpen.set(false);
    this.pendingConfirmation.set(null);
  }

  protected toggleOpen(): void {
    if (this.isOpen()) {
      this.close();
      return;
    }
    this.open();
  }

  protected selectAction(action: AttendanceActionOption): void {
    if (this.disabled() || !action.enabled || !action.actionId) return;

    if (action.actionId === 'REGISTRAR_SALIDA') {
      this.pendingConfirmation.set(action);
      return;
    }

    this.confirmAction(action.actionId);
  }

  protected confirmPendingAction(): void {
    const actionId = this.pendingConfirmation()?.actionId;
    if (actionId) this.confirmAction(actionId);
  }

  protected cancelPendingAction(): void {
    this.pendingConfirmation.set(null);
  }

  protected acknowledgeLunch(): void {
    this.lunchAcknowledged.set(true);
  }

  protected actionColor(action: AttendanceActionOption): string {
    return ATTENDANCE_STATUS_META[action.targetStatus].color;
  }

  protected tramoColor(tipo: TramoDiaVm['tipo']): string {
    if (tipo === 'EXTRA') return '#d9a93a';
    if (tipo === 'COMPENSABLE') return '#e08a3c';
    return '#8fb5a9';
  }

  private confirmAction(actionId: AttendanceActionId): void {
    this.pendingConfirmation.set(null);
    this.isOpen.set(false);
    this.actionSelected.emit(actionId);
  }
}
