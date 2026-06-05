import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { FormArray, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToggleButtonModule } from 'primeng/togglebutton';

const MODALIDADES_SIN_ALMUERZO = new Set(['PART_TIME', 'SEMI_FULL']);
const YES_NO_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Si', value: 'true' },
  { label: 'No', value: 'false' }
];
const DIA_LABELS: Record<string, string> = {
  LUNES: 'Lunes',
  MARTES: 'Martes',
  MIERCOLES: 'Miercoles',
  JUEVES: 'Jueves',
  VIERNES: 'Viernes',
  SABADO: 'Sabado',
  DOMINGO: 'Domingo'
};

/**
 * Editor reutilizable del horario.
 *
 * Recibe el formGroup ya construido y la modalidad. Maneja toggle simple/avanzado
 * y day-strip de descanso. No conoce facade, HTTP ni endpoints.
 *
 * Emite (simpleChanged) cuando el contenedor debe re-aplicar el horario simple
 * a los detalles (lo orquesta el facade del padre).
 */
@Component({
  selector: 'app-schedule-editor-panel',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    DatePickerModule,
    MessageModule,
    SelectModule,
    TagModule,
    ToggleButtonModule
  ],
  templateUrl: './schedule-editor-panel.component.html',
  styleUrl: './schedule-editor-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleEditorPanelComponent {
  @Input({ required: true }) horarioForm!: FormGroup;
  @Input() modalidad: string = 'FULL_TIME';
  @Input() diasSemanaOptions: readonly string[] = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

  @Output() simpleChanged = new EventEmitter<void>();

  protected readonly yesNoOptions = YES_NO_OPTIONS;
  private readonly modalitySignal = signal<string>('FULL_TIME');
  protected readonly usesLunchBreakSig = computed(() => !MODALIDADES_SIN_ALMUERZO.has(this.modalitySignal()));
  private simpleTimeSnapshot: Record<string, string> | null = null;
  private readonly rowTimeSnapshots = new Map<number, Record<string, string>>();

  ngOnChanges(): void {
    this.modalitySignal.set(this.modalidad ?? 'FULL_TIME');
  }

  protected get detallesArray(): FormArray {
    return this.horarioForm.get('detalles') as FormArray;
  }

  protected isAdvanced(): boolean {
    return this.horarioForm.get('modoAvanzado')?.value === 'true';
  }

  protected toggleAdvanced(): void {
    const next = !this.isAdvanced();
    this.horarioForm.get('modoAvanzado')?.setValue(next ? 'true' : 'false');
    if (!next) {
      this.simpleChanged.emit();
    }
  }

  protected isCompensable(): boolean {
    return this.horarioForm.get('compensable')?.value === 'true';
  }

  protected setCompensable(enabled: boolean): void {
    this.horarioForm.get('compensable')?.setValue(enabled ? 'true' : 'false');
  }

  protected isRestDay(day: string): boolean {
    return this.horarioForm.get('diaDescanso')?.value === day;
  }

  protected selectRestDay(day: string): void {
    this.horarioForm.get('diaDescanso')?.setValue(day);
    this.simpleChanged.emit();
  }

  protected onSimpleTimeChange(): void {
    this.simpleChanged.emit();
  }

  protected captureSimpleTimes(): void {
    this.simpleTimeSnapshot = this.readTimeControls(this.horarioForm);
  }

  protected onSimpleEntryTimeChange(): void {
    const delta = this.resolveDelta(this.simpleTimeSnapshot?.['horaEntrada'], this.horarioForm.get('horaEntrada')?.value);
    if (delta !== null) {
      this.shiftControl(this.horarioForm, 'horaSalida', delta);
      if (this.usesLunchBreakSig()) {
        this.shiftControl(this.horarioForm, 'inicioAlmuerzo', delta);
        this.shiftControl(this.horarioForm, 'finAlmuerzo', delta);
      }
    }
    this.captureSimpleTimes();
    this.simpleChanged.emit();
  }

  protected onSimpleLunchStartTimeChange(): void {
    const delta = this.resolveDelta(
      this.simpleTimeSnapshot?.['inicioAlmuerzo'],
      this.horarioForm.get('inicioAlmuerzo')?.value
    );
    if (delta !== null) {
      this.shiftControl(this.horarioForm, 'finAlmuerzo', delta);
    }
    this.captureSimpleTimes();
    this.simpleChanged.emit();
  }

  protected onSimpleIndependentTimeChange(): void {
    this.captureSimpleTimes();
    this.simpleChanged.emit();
  }

  protected captureRowTimes(index: number): void {
    const row = this.detallesArray.at(index) as FormGroup;
    this.rowTimeSnapshots.set(index, this.readTimeControls(row));
  }

  protected onRowEntryTimeChange(index: number): void {
    const row = this.detallesArray.at(index) as FormGroup;
    const snapshot = this.rowTimeSnapshots.get(index);
    const delta = this.resolveDelta(snapshot?.['horaEntrada'], row.get('horaEntrada')?.value);
    if (delta !== null) {
      this.shiftControl(row, 'horaSalida', delta);
      if (this.usesLunchBreakSig()) {
        this.shiftControl(row, 'inicioAlmuerzo', delta);
        this.shiftControl(row, 'finAlmuerzo', delta);
      }
    }
    this.captureRowTimes(index);
  }

  protected onRowLunchStartTimeChange(index: number): void {
    const row = this.detallesArray.at(index) as FormGroup;
    const snapshot = this.rowTimeSnapshots.get(index);
    const delta = this.resolveDelta(snapshot?.['inicioAlmuerzo'], row.get('inicioAlmuerzo')?.value);
    if (delta !== null) {
      this.shiftControl(row, 'finAlmuerzo', delta);
    }
    this.captureRowTimes(index);
  }

  protected onRowIndependentTimeChange(index: number): void {
    this.captureRowTimes(index);
  }

  protected dayShort(day: string): string {
    return (DIA_LABELS[day] ?? day).slice(0, 3);
  }

  protected dayLabel(day: string): string {
    return DIA_LABELS[day] ?? day;
  }

  private readTimeControls(group: FormGroup): Record<string, string> {
    return {
      horaEntrada: group.get('horaEntrada')?.value ?? '',
      horaSalida: group.get('horaSalida')?.value ?? '',
      inicioAlmuerzo: group.get('inicioAlmuerzo')?.value ?? '',
      finAlmuerzo: group.get('finAlmuerzo')?.value ?? ''
    };
  }

  private resolveDelta(beforeValue: string | null | undefined, afterValue: string | null | undefined): number | null {
    const before = this.parseTimeToMinutes(beforeValue);
    const after = this.parseTimeToMinutes(afterValue);
    return before !== null && after !== null && before !== after ? after - before : null;
  }

  private shiftControl(group: FormGroup, controlName: string, deltaMinutes: number): void {
    const control = group.get(controlName);
    const shifted = this.shiftTime(control?.value, deltaMinutes);
    if (shifted) {
      control?.setValue(shifted);
    }
  }

  private shiftTime(value: string | null | undefined, deltaMinutes: number): string | null {
    const minutes = this.parseTimeToMinutes(value);
    if (minutes === null) {
      return null;
    }
    const next = Math.max(0, Math.min(23 * 60 + 59, minutes + deltaMinutes));
    const hours = Math.floor(next / 60);
    const mins = next % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  private parseTimeToMinutes(value: string | null | undefined): number | null {
    if (!value) {
      return null;
    }
    const match = /^(\d{2}):(\d{2})/.exec(value);
    if (!match) {
      return null;
    }
    return Number(match[1]) * 60 + Number(match[2]);
  }
}
