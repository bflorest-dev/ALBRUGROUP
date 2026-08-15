import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
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

export type CorrimientoRazon = Extract<RazonAjuste, 'CORRIMIENTO_COMPENSABLE' | 'CORRIMIENTO_JUSTIFICADA'>;

@Component({
  selector: 'app-schedule-shift-editor',
  imports: [FormsModule, ButtonModule, TextareaModule],
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
  readonly canCompensable = input(false);
  readonly canJustificada = input(true);

  readonly saveRequested = output<RegistrarAjusteV2Request>();
  readonly cancel = output<void>();

  private readonly STEP = 30;
  private readonly MAX = 240;

  protected readonly nuevaEntradaMin = signal(540);
  protected readonly nuevaSalidaMin = signal(1080);
  protected readonly mantenerDuracion = signal(true);
  protected readonly motivo = signal('');
  protected readonly razon = signal<CorrimientoRazon>('CORRIMIENTO_JUSTIFICADA');

  constructor() {
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
    if (!jornada || !tramo) return null;
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

  private readonly newStart = computed(() => this.nuevaEntradaMin());
  private readonly newEnd = computed(() => {
    const start = this.newStart();
    return this.mantenerDuracion() ? start + this.duracionBase() : this.nuevaSalidaMin();
  });

  protected readonly nuevaEntradaLabel = computed(() => this.fmtHm(this.nuevaEntradaMin()));
  protected readonly nuevaSalidaLabel = computed(() => this.fmtHm(this.newEnd()));

  protected readonly rangoInvalido = computed(() => this.newEnd() <= this.newStart());

  protected readonly sinCambio = computed(() => {
    const b = this.base();
    return !!b && this.newStart() === b.inicioMin && this.newEnd() === b.finMin;
  });

  protected readonly desplazamiento = computed(() => {
    const b = this.base();
    return b ? this.newStart() - b.inicioMin : 0;
  });

  protected readonly desplazamientoLabel = computed(() => {
    const delta = this.desplazamiento();
    if (delta === 0) return 'Sin corrimiento';
    return (delta > 0 ? 'Corre +' : 'Adelanta ') + this.fmtDur(Math.abs(delta));
  });

  private readonly duracionNueva = computed(() => {
    const end = this.newEnd();
    const start = this.newStart();
    return end > start ? end - start : 0;
  });

  protected readonly recorteMin = computed(() => Math.max(0, this.duracionBase() - this.duracionNueva()));

  protected readonly nuevaVentanaLabel = computed(() => {
    const start = this.newStart();
    const end = this.newEnd();
    return end > start ? `${this.fmtHm(start)}–${this.fmtHm(end)}` : '';
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
    if (end > start) {
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

  protected adjustEntrada(delta: number): void {
    const next = this.nuevaEntradaMin() + delta * this.STEP;
    if (next >= 0 && next < 24 * 60) {
      this.nuevaEntradaMin.set(next);
    }
  }

  protected adjustSalida(delta: number): void {
    if (this.mantenerDuracion()) return;
    const next = this.nuevaSalidaMin() + delta * this.STEP;
    if (next > 0 && next <= 24 * 60) {
      this.nuevaSalidaMin.set(next);
    }
  }

  protected setRazon(razon: CorrimientoRazon): void {
    this.razon.set(razon);
  }

  protected toggleMantenerDuracion(): void {
    this.mantenerDuracion.update((value) => {
      if (value) {
        this.nuevaSalidaMin.set(this.newEnd());
      }
      return !value;
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
    this.saveRequested.emit({
      inicio: `${b.fecha}T${this.fmtHm(start)}:00`,
      fin: `${b.fecha}T${this.fmtHm(end)}:00`,
      motivo: this.motivo().trim(),
      razon: this.razon()
    });
  }

  private reset(): void {
    const b = this.base();
    this.nuevaEntradaMin.set(b ? b.inicioMin : 540);
    this.nuevaSalidaMin.set(b ? b.finMin : 1080);
    this.mantenerDuracion.set(true);
    this.motivo.set('');
    this.razon.set(this.canCompensable() ? 'CORRIMIENTO_COMPENSABLE' : 'CORRIMIENTO_JUSTIFICADA');
  }

  private toMin(iso: string): number {
    const match = /T(\d{2}):(\d{2})/.exec(iso);
    return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
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
