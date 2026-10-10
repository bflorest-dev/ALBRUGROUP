import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { JornadaEfectivaPeriodoDiaResponse } from '../../models/schedule/jornada-efectiva-periodo-response';
import { RegistrarExcepcionHorarioRequest } from '../../models/schedule/registrar-excepcion-horario-request';

export type ScheduleDayChangeAction =
  | 'ajuste-extra'
  | 'ajuste-compensacion'
  | 'ajuste-corrimiento'
  | 'ajuste-almuerzo'
  | 'ajuste-jornada-extra'
  | 'ajuste-compensar-falta'
  | 'ajuste-dia-libre';

@Component({
  selector: 'app-schedule-day-editor',
  templateUrl: './schedule-day-editor.component.html',
  styleUrl: './schedule-day-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleDayEditorComponent {
  readonly day = input<JornadaEfectivaPeriodoDiaResponse | null>(null);
  readonly mode = input<'editor' | 'options'>('editor');
  readonly canReset = input(false);
  readonly resetReason = input('');
  readonly canMutate = input(false);
  readonly saving = input(false);
  readonly error = input('');
  readonly requiresLunch = input(true);

  readonly saved = output<RegistrarExcepcionHorarioRequest>();
  readonly resetRequested = output<void>();
  readonly addChange = output<ScheduleDayChangeAction>();
  readonly editRequested = output<void>();

  protected readonly entrada = signal('');
  protected readonly salida = signal('');
  protected readonly tieneAlmuerzo = signal(false);
  protected readonly inicioAlmuerzo = signal('');
  protected readonly finAlmuerzo = signal('');
  protected readonly motivo = signal('');
  protected readonly formError = signal('');

  private initializedKey = '';

  constructor() {
    effect(() => {
      const day = this.day();
      const key = day ? `${day.fecha}:${day.estado}:${day.cambios.length}:${this.mode()}` : '';
      if (!day || key === this.initializedKey) return;
      this.initializedKey = key;
      this.initialize(day);
    });
  }

  protected dayLabel(): string {
    const value = this.day()?.fecha;
    if (!value) return 'Día seleccionado';
    const date = new Date(`${value}T12:00:00`);
    return new Intl.DateTimeFormat('es-PE', {
      weekday: 'long', day: 'numeric', month: 'long'
    }).format(date);
  }

  protected hasChanges(): boolean {
    return Boolean(this.day()?.cambios.length);
  }

  protected changeLabel(codigo: string, tipo: string): string {
    if (tipo === 'CAMBIO_ALMUERZO') return 'Almuerzo programado';
    if (tipo === 'DIA_NO_LABORABLE') return codigo === 'FERIADO' ? 'Feriado' : 'Día libre';
    return {
      AMPLIACION_OPERATIVA: 'Horas extra',
      COMPENSACION: 'Compensación',
      CORRIMIENTO_COMPENSABLE: 'Horario corrido',
      CORRIMIENTO_JUSTIFICADA: 'Horario corrido',
      CAMBIO_COMPLETO: 'Cambio de horario'
    }[codigo] ?? 'Cambio de horario';
  }

  protected changeDetail(change: JornadaEfectivaPeriodoDiaResponse['cambios'][number]): string {
    if (change.inicio && change.fin) {
      return `${this.timeOnly(change.inicio)} a ${this.timeOnly(change.fin)}${change.motivo ? ` · ${change.motivo}` : ''}`;
    }
    return change.motivo || 'Cambio registrado para este día';
  }

  protected fullChangeExists(): boolean {
    return Boolean(this.day()?.cambios.some((change) =>
      change.tipo === 'EXCEPCION_HORARIO' && change.codigo === 'CAMBIO_COMPLETO'));
  }

  protected calendarOverrideExists(): boolean {
    return Boolean(this.day()?.cambios.some((change) => change.tipo === 'DIA_NO_LABORABLE'));
  }

  protected editorBlockedMessage(): string {
    if (!this.day()?.idHorario) return 'Este día no tiene un horario vigente sobre el que se pueda aplicar un cambio.';
    if (this.fullChangeExists()) return 'Ya existe un cambio completo para este día. Restablece primero el horario base.';
    if (this.calendarOverrideExists()) return 'Este día está marcado como no laborable. Usa “Habilitar jornada” o restablece el permiso del empleado antes de cambiar su horario.';
    return '';
  }

  submit(): void {
    const day = this.day();
    if (!day || !this.canMutate() || !day.idHorario) return;
    this.formError.set('');
    const start = this.toMinutes(this.entrada());
    const end = this.toMinutes(this.salida());
    if (!this.entrada() || !this.salida()) {
      this.formError.set('Completa la hora de entrada y la hora de salida.');
      return;
    }
    if (start === null || end === null || end <= start) {
      this.formError.set('La hora de salida debe ser posterior a la hora de entrada.');
      return;
    }
    if (this.fullChangeExists() || this.calendarOverrideExists()) {
      this.formError.set(this.editorBlockedMessage());
      return;
    }
    if (!this.motivo().trim()) {
      this.formError.set('Indica por qué necesitas cambiar el horario de este día.');
      return;
    }
    if (this.tieneAlmuerzo() && (!this.inicioAlmuerzo() || !this.finAlmuerzo())) {
      this.formError.set('Completa el inicio y el fin del almuerzo, o desactívalo.');
      return;
    }
    if (this.tieneAlmuerzo()) {
      const lunchStart = this.toMinutes(this.inicioAlmuerzo());
      const lunchEnd = this.toMinutes(this.finAlmuerzo());
      if (lunchStart === null || lunchEnd === null || lunchEnd <= lunchStart
          || lunchStart < start || lunchEnd > end) {
        this.formError.set('El almuerzo debe estar dentro del horario de trabajo.');
        return;
      }
    }
    this.saved.emit({
      fecha: day.fecha,
      tipo: 'CAMBIO_COMPLETO',
      horaEntrada: this.entrada(),
      horaSalida: this.salida(),
      inicioAlmuerzo: this.tieneAlmuerzo() ? this.inicioAlmuerzo() : null,
      finAlmuerzo: this.tieneAlmuerzo() ? this.finAlmuerzo() : null,
      laborable: true,
      motivo: this.motivo().trim()
    });
  }

  protected setLunchEnabled(enabled: boolean): void {
    this.formError.set('');
    this.tieneAlmuerzo.set(enabled);
    if (enabled && !this.inicioAlmuerzo()) {
      const start = this.toMinutes(this.entrada()) ?? 8 * 60;
      const lunch = Math.min(start + 4 * 60, (this.toMinutes(this.salida()) ?? 17 * 60) - 60);
      this.inicioAlmuerzo.set(this.toTime(Math.max(start, lunch)));
      this.finAlmuerzo.set(this.toTime(Math.max(start + 30, lunch + 60)));
    }
  }

  private initialize(day: JornadaEfectivaPeriodoDiaResponse): void {
    const base = day.horarioBase;
    const effective = day.jornadaEfectiva.tramos.find((tramo) => tramo.esBaseEfectiva)
      ?? day.jornadaEfectiva.tramos[0];
    const entrada = this.timeOnly(base?.inicio) || this.timeOnly(effective?.inicio) || '';
    const salida = this.timeOnly(base?.fin) || this.timeOnly(effective?.fin) || '';
    const lunchStart = this.timeOnly(day.almuerzo?.inicioEfectivo) || this.timeOnly(base?.almuerzoInicio) || '';
    const lunchEnd = this.timeOnly(day.almuerzo?.finEfectivo) || this.timeOnly(base?.almuerzoFin) || '';
    this.entrada.set(entrada);
    this.salida.set(salida);
    this.inicioAlmuerzo.set(lunchStart);
    this.finAlmuerzo.set(lunchEnd);
    this.tieneAlmuerzo.set(Boolean(lunchStart && lunchEnd) && this.requiresLunch());
    this.motivo.set('');
    this.formError.set('');
  }

  private timeOnly(value: string | null | undefined): string {
    if (!value) return '';
    const match = /(?:T|\s)?(\d{1,2}:\d{2})/.exec(value);
    return match?.[1] ?? '';
  }

  private toMinutes(value: string): number | null {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  }

  private toTime(minutes: number): string {
    const normalized = Math.max(0, Math.min(23 * 60 + 59, minutes));
    return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
  }
}
