import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { CorregirMarcacionesRequest, MarcacionEditableResponse } from '../../../../shared/models/schedule/marcacion-editable-response';
import { ReporteDiaResponse } from '../../../../shared/models/schedule/reporte-dia-response';

interface DraftMarcacion {
  source: MarcacionEditableResponse;
  entrada: string;
  salida: string;
}

@Component({
  selector: 'app-attendance-marks-editor',
  standalone: true,
  templateUrl: './attendance-marks-editor.component.html',
  styleUrl: './attendance-marks-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttendanceMarksEditorComponent {
  readonly reporte = input<ReporteDiaResponse | null>(null);
  readonly externalError = input('');
  readonly saving = input(false);
  readonly cancelar = output<void>();
  readonly guardar = output<CorregirMarcacionesRequest>();

  protected readonly drafts = signal<DraftMarcacion[]>([]);
  protected readonly error = signal('');

  constructor() {
    effect(() => {
      const report = this.reporte();
      this.drafts.set((report?.marcaciones ?? []).map((source) => ({
        source,
        entrada: this.time(source.entradaReal),
        salida: this.time(source.salidaReal)
      })));
      this.error.set('');
    });
  }

  protected setTime(index: number, field: 'entrada' | 'salida', value: string): void {
    this.drafts.update((items) => items.map((item, current) => current === index ? { ...item, [field]: value } : item));
    this.error.set('');
  }

  protected markLabel(mark: MarcacionEditableResponse): string {
    if (mark.tipoRegistro === 'PRINCIPAL' && mark.esBase) return 'Marcación principal';
    if (mark.tipoTramo === 'COMPENSABLE') return 'Compensación';
    if (mark.origen === 'JORNADA_EXTRAORDINARIA') return 'Hora extra';
    if (mark.origen === 'REEMPLAZO_BASE') return 'Horario corrido';
    if (mark.origen === 'AMPLIACION') return 'Ampliación';
    return 'Tramo adicional';
  }

  protected scheduledLabel(mark: MarcacionEditableResponse): string {
    if (!mark.entradaProgramada) return 'Sin horario programado';
    return `${this.time(mark.entradaProgramada)} – ${mark.salidaProgramada ? this.time(mark.salidaProgramada) : '—'}`;
  }

  protected submit(): void {
    const report = this.reporte();
    const drafts = this.drafts();
    if (!report || !drafts.length) {
      this.error.set('No hay marcaciones editables para esta fecha.');
      return;
    }
    const changed = drafts.filter((draft) => this.hasChanges(draft));
    if (!changed.length) {
      this.error.set('Realiza al menos un cambio antes de guardar.');
      return;
    }
    if (!this.validateDrafts(drafts)) return;

    this.guardar.emit({
      marcaciones: changed.map((draft) => ({
        tipoRegistro: draft.source.tipoRegistro,
        idRegistro: draft.source.idRegistro,
        entrada: this.timestamp(draft.source.entradaReal, draft.entrada, report.fecha),
        salida: draft.source.abierta ? null : this.timestamp(draft.source.salidaReal, draft.salida, report.fecha)
      }))
    });
  }

  protected cancel(): void {
    this.cancelar.emit();
  }

  private validateDrafts(drafts: DraftMarcacion[]): boolean {
    const windows = drafts
      .filter((draft) => draft.entrada)
      .map((draft) => ({
        draft,
        entrada: this.timestamp(draft.source.entradaReal, draft.entrada, this.reporte()?.fecha ?? ''),
        salida: draft.source.abierta ? null : this.timestamp(draft.source.salidaReal, draft.salida, this.reporte()?.fecha ?? '')
      }))
      .sort((a, b) => (a.entrada ?? '').localeCompare(b.entrada ?? ''));

    for (let index = 0; index < windows.length; index += 1) {
      const window = windows[index];
      if (!window.entrada) {
        this.error.set(`La ${this.markLabel(window.draft.source).toLowerCase()} necesita una hora de entrada.`);
        return false;
      }
      if (window.salida && window.salida <= window.entrada) {
        this.error.set(`La salida de ${this.markLabel(window.draft.source).toLowerCase()} debe ser posterior a la entrada.`);
        return false;
      }
      if (!window.salida && index < windows.length - 1) {
        this.error.set('Una jornada abierta no puede preceder a otro intervalo.');
        return false;
      }
      const previous = windows[index - 1];
      if (previous?.salida && window.entrada < previous.salida) {
        this.error.set('Las marcaciones no pueden solaparse.');
        return false;
      }
    }
    return true;
  }

  private hasChanges(draft: DraftMarcacion): boolean {
    return draft.entrada !== this.time(draft.source.entradaReal)
      || (!draft.source.abierta && draft.salida !== this.time(draft.source.salidaReal));
  }

  private timestamp(original: string | null, time: string, fallbackDate: string): string | null {
    if (!time) return original;
    const date = original?.slice(0, 10) || fallbackDate;
    return `${date}T${time}:00`;
  }

  private time(value: string | null): string {
    return value?.slice(11, 16) ?? '';
  }
}
