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

  protected dayShort(day: string): string {
    return (DIA_LABELS[day] ?? day).slice(0, 3);
  }

  protected dayLabel(day: string): string {
    return DIA_LABELS[day] ?? day;
  }
}
