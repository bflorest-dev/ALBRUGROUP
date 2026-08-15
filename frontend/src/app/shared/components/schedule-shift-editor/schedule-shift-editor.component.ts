import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import {
  JornadaEfectivaResponse,
  RazonAjuste,
  RegistrarAjusteV2Request
} from '../../models/schedule/jornada-efectiva-response';

type ShiftBlock = {
  leftPct: number;
  widthPct: number;
  kind: 'ghost' | 'moved';
  label: string;
  title: string;
};

/** Las dos razones de corrimiento (mover el base por una tardanza). */
export type CorrimientoRazon = Extract<RazonAjuste, 'CORRIMIENTO_COMPENSABLE' | 'CORRIMIENTO_JUSTIFICADA'>;

/**
 * Editor de corrimiento (presentacional, sin diálogo): mueve la ventana del horario base del día como una
 * unidad — el bloque base queda de fantasma y el nuevo se dibuja desplazado. A diferencia del timeline aditivo
 * (horas extra / compensación), aquí se REEMPLAZA el base (backend → REEMPLAZO_BASE). La razón la decide el rol:
 * `canCompensable` (ADMIN) habilita el toggle compensable/justificada; RRHH solo justificada (fija). Emite el
 * request v2 completo (con razón); el padre hace la llamada.
 */
@Component({
  selector: 'app-schedule-shift-editor',
  imports: [FormsModule, ButtonModule, DatePickerModule, TextareaModule],
  templateUrl: './schedule-shift-editor.component.html',
  styleUrl: './schedule-shift-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleShiftEditorComponent {
  readonly jornada = input<JornadaEfectivaResponse | null>(null);
  readonly employeeName = input('');
  readonly loading = input(false);
  readonly saving = input(false);
  readonly error = input<string | null>(null);
  /** ADMIN puede aplicar tardanza compensable (genera déficit). Habilita el toggle. */
  readonly canCompensable = input(false);
  /** ADMIN y RRHH pueden aplicar tardanza justificada (sin déficit). */
  readonly canJustificada = input(true);

  readonly saveRequested = output<RegistrarAjusteV2Request>();
  readonly cancel = output<void>();

  private readonly MAX = 240; // ventana visible: base ± 4 h

  protected readonly nuevaEntrada = signal('09:00');
  protected readonly nuevaSalida = signal('18:00');
  protected readonly mantenerDuracion = signal(true);
  protected readonly motivo = signal('');
  protected readonly razon = signal<CorrimientoRazon>('CORRIMIENTO_JUSTIFICADA');

  constructor() {
    // Al cambiar la jornada (nuevo empleado/día) o los permisos de rol, re-sincronizar el formulario.
    effect(() => {
      this.jornada();
      this.canCompensable();
      untracked(() => this.reset());
    });
  }

  protected readonly showRazonToggle = computed(() => this.canCompensable() && this.canJustificada());

  private readonly base = computed(() => {
    const jornada = this.jornada();
    const tramo = jornada?.tramos.find((item) => item.base) ?? null;
    if (!jornada || !tramo) {
      return null;
    }
    return { fecha: jornada.fecha, inicioMin: this.toMin(tramo.inicio), finMin: this.toMin(tramo.fin) };
  });

  protected readonly hasBase = computed(() => this.base() !== null);
  private readonly duracionBase = computed(() => {
    const b = this.base();
    return b ? b.finMin - b.inicioMin : 0;
  });

  protected readonly baseLabel = computed(() => {
    const b = this.base();
    return b ? `${this.fmtHm(b.inicioMin)}–${this.fmtHm(b.finMin)}` : '';
  });

  private readonly newStart = computed(() => this.toMinHm(this.nuevaEntrada()));
  private readonly newEnd = computed(() => {
    const start = this.newStart();
    if (start === null) return null;
    return this.mantenerDuracion() ? start + this.duracionBase() : this.toMinHm(this.nuevaSalida());
  });

  protected readonly rangoInvalido = computed(() => {
    const start = this.newStart();
    const end = this.newEnd();
    return start === null || end === null || end <= start;
  });

  protected readonly sinCambio = computed(() => {
    const b = this.base();
    return !!b && this.newStart() === b.inicioMin && this.newEnd() === b.finMin;
  });

  protected readonly desplazamiento = computed(() => {
    const b = this.base();
    const start = this.newStart();
    return b && start !== null ? start - b.inicioMin : 0;
  });

  protected readonly desplazamientoLabel = computed(() => {
    const delta = this.desplazamiento();
    if (delta === 0) return 'Sin corrimiento';
    return (delta > 0 ? 'Corre +' : 'Adelanta ') + this.fmtDur(Math.abs(delta));
  });

  private readonly duracionNueva = computed(() => {
    const start = this.newStart();
    const end = this.newEnd();
    return start !== null && end !== null && end > start ? end - start : 0;
  });

  /** Minutos que se pierden respecto al base (jornada acortada). 0 si mantiene o alarga. */
  protected readonly recorteMin = computed(() => Math.max(0, this.duracionBase() - this.duracionNueva()));

  protected readonly nuevaVentanaLabel = computed(() => {
    const start = this.newStart();
    const end = this.newEnd();
    if (start === null || end === null || end <= start) return '';
    return `${this.fmtHm(start)}–${this.fmtHm(end)}`;
  });

  private readonly winStart = computed(() => {
    const b = this.base();
    return b ? b.inicioMin - this.MAX : 0;
  });
  private readonly winEnd = computed(() => {
    const b = this.base();
    return b ? b.finMin + this.MAX : 24 * 60;
  });

  protected readonly blocks = computed<ShiftBlock[]>(() => {
    const b = this.base();
    if (!b) return [];
    const ws = this.winStart();
    const span = this.winEnd() - ws;
    const pos = (min: number) => ((min - ws) / span) * 100;
    const width = (start: number, end: number) => ((end - start) / span) * 100;
    const range = (start: number, end: number) => this.fmtHm(start) + '–' + this.fmtHm(end);
    const out: ShiftBlock[] = [
      {
        leftPct: pos(b.inicioMin),
        widthPct: width(b.inicioMin, b.finMin),
        kind: 'ghost',
        label: range(b.inicioMin, b.finMin),
        title: 'Horario base ' + range(b.inicioMin, b.finMin)
      }
    ];
    const start = this.newStart();
    const end = this.newEnd();
    if (start !== null && end !== null && end > start) {
      out.push({
        leftPct: pos(start),
        widthPct: width(start, end),
        kind: 'moved',
        label: range(start, end),
        title: 'Nueva ventana ' + range(start, end)
      });
    }
    return out;
  });

  protected readonly axis = computed<string[]>(() => {
    const out: string[] = [];
    for (let h = this.winStart(); h <= this.winEnd(); h += 120) {
      out.push(this.fmtHm(h));
    }
    return out;
  });

  protected readonly canSave = computed(
    () =>
      this.hasBase() &&
      !this.rangoInvalido() &&
      !this.sinCambio() &&
      this.motivo().trim().length > 0 &&
      !this.saving()
  );

  protected setRazon(razon: CorrimientoRazon): void {
    this.razon.set(razon);
  }

  protected toggleMantenerDuracion(): void {
    this.mantenerDuracion.update((value) => {
      const next = !value;
      // Al soltar la duración, arrancar la nueva salida donde termina la ventana vigente (sin salto).
      if (!next) {
        const end = this.newEnd();
        if (end !== null) this.nuevaSalida.set(this.fmtHm(end));
      }
      return next;
    });
  }

  protected onMotivo(event: Event): void {
    this.motivo.set((event.target as HTMLTextAreaElement).value);
  }

  protected emitCancel(): void {
    this.cancel.emit();
  }

  protected save(): void {
    const b = this.base();
    if (!b || !this.canSave()) return;
    const start = this.newStart();
    const end = this.newEnd();
    if (start === null || end === null) return;
    this.saveRequested.emit({
      inicio: `${b.fecha}T${this.fmtHm(start)}:00`,
      fin: `${b.fecha}T${this.fmtHm(end)}:00`,
      motivo: this.motivo().trim(),
      razon: this.razon()
    });
  }

  private reset(): void {
    const b = this.base();
    this.nuevaEntrada.set(b ? this.fmtHm(b.inicioMin) : '09:00');
    this.nuevaSalida.set(b ? this.fmtHm(b.finMin) : '18:00');
    this.mantenerDuracion.set(true);
    this.motivo.set('');
    this.razon.set(this.canCompensable() ? 'CORRIMIENTO_COMPENSABLE' : 'CORRIMIENTO_JUSTIFICADA');
  }

  private toMin(iso: string): number {
    const match = /T(\d{2}):(\d{2})/.exec(iso);
    return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
  }

  private toMinHm(value: string): number | null {
    const match = /^(\d{2}):(\d{2})$/.exec(value);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  }

  private fmtHm(min: number): string {
    const hours = Math.floor(min / 60);
    const minutes = min % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  private fmtDur(min: number): string {
    const hours = Math.floor(min / 60);
    const minutes = min % 60;
    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours} h`;
    return `${hours} h ${minutes} min`;
  }
}
