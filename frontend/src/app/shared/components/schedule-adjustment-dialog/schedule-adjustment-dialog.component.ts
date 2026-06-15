import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnChanges,
  SimpleChanges,
  input,
  output
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import {
  AjusteJornadaRequest,
  AjusteJornadaResponse,
  JornadaEfectivaResponse,
  PreviewAjusteJornadaResponse,
  TramoJornadaResponse
} from '../../models/schedule/jornada-efectiva-response';

@Component({
  selector: 'app-schedule-adjustment-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    DialogModule,
    MessageModule,
    TagModule,
    TextareaModule
  ],
  templateUrl: './schedule-adjustment-dialog.component.html',
  styleUrl: './schedule-adjustment-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleAdjustmentDialogComponent implements OnChanges {
  readonly visible = input(false);
  readonly employeeName = input('');
  readonly selectedDate = input('');
  readonly allowDateChange = input(false);
  readonly jornada = input<JornadaEfectivaResponse | null>(null);
  readonly preview = input<PreviewAjusteJornadaResponse | null>(null);
  readonly history = input<readonly AjusteJornadaResponse[]>([]);
  readonly loading = input(false);
  readonly saving = input(false);
  readonly error = input<string | null>(null);

  readonly closed = output<void>();
  readonly dateChanged = output<string>();
  readonly previewRequested = output<AjusteJornadaRequest>();
  readonly saveRequested = output<AjusteJornadaRequest>();
  readonly cancelRequested = output<number>();

  protected readonly dialogStyle = { width: '42rem', maxWidth: '96vw' };
  protected readonly minDate = new Date();
  protected readonly form = new FormGroup({
    fecha: new FormControl<Date | null>(null, { validators: [Validators.required] }),
    inicio: new FormControl<Date | null>(null, { validators: [Validators.required] }),
    fin: new FormControl<Date | null>(null, { validators: [Validators.required] }),
    motivo: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(300)] })
  });

  private initializedKey = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['visible'] && !changes['selectedDate'] && !changes['jornada']) return;
    if (!this.visible()) {
      this.initializedKey = '';
      return;
    }
    const key = `${this.selectedDate()}-${this.jornada()?.tramos.map((item) => item.idAjuste ?? 'base').join(',') ?? ''}`;
    if (key === this.initializedKey) return;
    this.initializedKey = key;
    this.form.controls.fecha.setValue(this.parseDate(this.selectedDate()));
    const preferred = this.preferredTramo();
    this.form.controls.inicio.setValue(this.parseTime(preferred?.inicio));
    this.form.controls.fin.setValue(this.parseTime(preferred?.fin));
    this.form.controls.motivo.setValue('');
  }

  protected onDateSelected(value: Date | null): void {
    if (!value) return;
    this.dateChanged.emit(this.formatDate(value));
  }

  protected requestPreview(): void {
    const request = this.buildRequest();
    if (request) this.previewRequested.emit(request);
  }

  protected save(): void {
    const request = this.buildRequest();
    if (request) this.saveRequested.emit(request);
  }

  protected formatDateTime(value: string | null | undefined): string {
    if (!value) return 'Sin horario';
    return value.slice(11, 16);
  }

  protected originLabel(tramo: TramoJornadaResponse): string {
    if (tramo.base) return 'Horario base';
    switch (tramo.origen) {
      case 'JORNADA_EXTRAORDINARIA':
        return 'Jornada extraordinaria';
      case 'TRAMO_ADICIONAL':
        return 'Tramo adicional';
      default:
        return 'Ajuste del día';
    }
  }

  protected statusSeverity(
    status: AjusteJornadaResponse['estado']
  ): 'success' | 'secondary' | 'warn' {
    if (status === 'ACTIVO') return 'success';
    if (status === 'REEMPLAZADO') return 'secondary';
    return 'warn';
  }

  private preferredTramo(): TramoJornadaResponse | null {
    const jornada = this.jornada();
    return jornada?.tramoActual ?? jornada?.proximoTramo ?? jornada?.tramos[0] ?? null;
  }

  private buildRequest(): AjusteJornadaRequest | null {
    this.form.markAllAsTouched();
    if (this.form.invalid) return null;
    const fecha = this.form.controls.fecha.value;
    const inicio = this.form.controls.inicio.value;
    const fin = this.form.controls.fin.value;
    if (!fecha || !inicio || !fin) return null;
    const date = this.formatDate(fecha);
    return {
      inicio: `${date}T${this.formatTime(inicio)}:00`,
      fin: `${date}T${this.formatTime(fin)}:00`,
      motivo: this.form.controls.motivo.value.trim()
    };
  }

  private parseDate(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
  }

  private parseTime(value: string | null | undefined): Date | null {
    if (!value) return null;
    const match = /T(\d{2}):(\d{2})/.exec(value);
    return match ? new Date(2000, 0, 1, Number(match[1]), Number(match[2])) : null;
  }

  private formatDate(value: Date): string {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }

  private formatTime(value: Date): string {
    return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
  }
}
