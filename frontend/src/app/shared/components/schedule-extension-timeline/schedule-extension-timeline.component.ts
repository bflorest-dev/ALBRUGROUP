import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { AjusteJornadaRequest, JornadaEfectivaResponse } from '../../models/schedule/jornada-efectiva-response';

type TimelineBlock = {
  leftPct: number;
  widthPct: number;
  kind: 'base' | 'exist' | 'new';
  label: string;
  title: string;
};

export type ExtensionMode = 'extra' | 'compensacion';

/**
 * Línea de tiempo aditiva (presentacional, sin diálogo): el horario base es un bloque bloqueado y solo se
 * AGREGA tiempo — ingresar antes / quedarse más / período aparte, todo disjunto del base. Reusable por el GTR
 * (horas extra) y por el drawer de ADMIN/RRHH (horas extra o compensación). El `mode` cambia color y copy;
 * `maxTotal` (minutos) acota el total para compensación (tope de déficit). Emite la lista de tramos; el padre
 * decide la razón y hace las N llamadas.
 */
@Component({
  selector: 'app-schedule-extension-timeline',
  imports: [FormsModule, ButtonModule, DatePickerModule, TextareaModule],
  templateUrl: './schedule-extension-timeline.component.html',
  styleUrl: './schedule-extension-timeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleExtensionTimelineComponent {
  readonly jornada = input<JornadaEfectivaResponse | null>(null);
  readonly employeeName = input('');
  readonly loading = input(false);
  readonly saving = input(false);
  readonly error = input<string | null>(null);
  readonly mode = input<ExtensionMode>('extra');
  /** Tope total en minutos (déficit para compensación). null = sin tope (horas extra). */
  readonly maxTotal = input<number | null>(null);

  readonly saveRequested = output<AjusteJornadaRequest[]>();
  readonly cancel = output<void>();

  private readonly STEP = 30;
  private readonly MAX = 240; // 4 h a cada extremo

  protected readonly before = signal(0);
  protected readonly after = signal(0);
  protected readonly detached = signal(false);
  protected readonly detStart = signal('20:00');
  protected readonly detEnd = signal('21:30');
  protected readonly motivo = signal('');

  constructor() {
    // Al cambiar la jornada (nuevo empleado/día), limpiar el formulario.
    effect(() => {
      this.jornada();
      untracked(() => this.resetForm());
    });
  }

  protected readonly descripcion = computed(() =>
    this.mode() === 'compensacion'
      ? 'El horario base no se modifica. Agregas tiempo para compensar las horas que quedaron debiendo.'
      : 'El horario base no se modifica. Solo agregas horas extra: que ingrese antes, que se quede más, o un período aparte (hasta 4 h de cada extremo).'
  );

  protected readonly summaryLabel = computed(() =>
    this.mode() === 'compensacion' ? 'Horas de compensación a registrar' : 'Horas extra nuevas a registrar'
  );

  private readonly base = computed(() => {
    const jornada = this.jornada();
    const tramo = jornada?.tramos.find((item) => item.base) ?? null;
    if (!jornada || !tramo) {
      return null;
    }
    return { fecha: jornada.fecha, inicioMin: this.toMin(tramo.inicio), finMin: this.toMin(tramo.fin) };
  });

  private readonly existing = computed(() =>
    (this.jornada()?.tramos ?? [])
      .filter((item) => !item.base)
      .map((item) => ({ inicioMin: this.toMin(item.inicio), finMin: this.toMin(item.fin) }))
  );

  // Los extras registrados se muestran fusionados por tramos contiguos: importa cuánto tiempo extra hay,
  // no en cuántos ajustes se registró. Los ajustes siguen separados en el backend (solo es presentación).
  private readonly mergedExisting = computed(() => {
    const items = [...this.existing()].sort((a, b) => a.inicioMin - b.inicioMin);
    const runs: { inicioMin: number; finMin: number }[] = [];
    for (const item of items) {
      const last = runs[runs.length - 1];
      if (last && item.inicioMin <= last.finMin) {
        last.finMin = Math.max(last.finMin, item.finMin);
      } else {
        runs.push({ inicioMin: item.inicioMin, finMin: item.finMin });
      }
    }
    return runs;
  });

  protected readonly hasBase = computed(() => this.base() !== null);
  private readonly winStart = computed(() => { const b = this.base(); return b ? b.inicioMin - this.MAX : 0; });
  private readonly winEnd = computed(() => { const b = this.base(); return b ? b.finMin + this.MAX : 24 * 60; });
  protected readonly winStartHm = computed(() => this.fmtHm(this.winStart()));
  protected readonly winEndHm = computed(() => this.fmtHm(this.winEnd()));

  // Anclaje contiguo: el tiempo nuevo se agrega desde el borde del extra ya registrado que pega con el base.
  private readonly beforeAnchor = computed(() => {
    const b = this.base();
    return b ? this.walkChain(b.inicioMin, this.existing(), 'left') : 0;
  });
  private readonly afterAnchor = computed(() => {
    const b = this.base();
    return b ? this.walkChain(b.finMin, this.existing(), 'right') : 0;
  });

  // Cupo restante libre: hasta la ventana (base +/- 4h), el extra disjunto más cercano y el tope total.
  protected readonly maxBefore = computed(() => {
    const anchor = this.beforeAnchor();
    let limit = this.winStart();
    for (const extra of this.existing()) {
      if (extra.finMin <= anchor) limit = Math.max(limit, extra.finMin);
    }
    const porVentana = Math.max(0, Math.floor((anchor - limit) / this.STEP) * this.STEP);
    return Math.min(porVentana, this.before() + this.remainingTotal());
  });
  protected readonly maxAfter = computed(() => {
    const anchor = this.afterAnchor();
    let limit = this.winEnd();
    for (const extra of this.existing()) {
      if (extra.inicioMin >= anchor) limit = Math.min(limit, extra.inicioMin);
    }
    const porVentana = Math.max(0, Math.floor((limit - anchor) / this.STEP) * this.STEP);
    return Math.min(porVentana, this.after() + this.remainingTotal());
  });

  /** Minutos que aún caben bajo el tope total (déficit); Infinity si no hay tope. */
  private remainingTotal(): number {
    const cap = this.maxTotal();
    if (cap === null) return Number.POSITIVE_INFINITY;
    return Math.max(0, cap - this.totalExtra());
  }

  private walkChain(from: number, extras: { inicioMin: number; finMin: number }[], dir: 'left' | 'right'): number {
    let anchor = from;
    const used = new Set<number>();
    let moved = true;
    while (moved) {
      moved = false;
      for (let i = 0; i < extras.length; i++) {
        if (used.has(i)) continue;
        if (dir === 'left' && extras[i].finMin === anchor) {
          anchor = extras[i].inicioMin;
          used.add(i);
          moved = true;
          break;
        }
        if (dir === 'right' && extras[i].inicioMin === anchor) {
          anchor = extras[i].finMin;
          used.add(i);
          moved = true;
          break;
        }
      }
    }
    return anchor;
  }

  protected readonly blocks = computed<TimelineBlock[]>(() => {
    const b = this.base();
    if (!b) return [];
    const ws = this.winStart();
    const span = this.winEnd() - ws;
    const pos = (min: number) => ((min - ws) / span) * 100;
    const width = (start: number, end: number) => ((end - start) / span) * 100;
    const range = (start: number, end: number) => this.fmtHm(start) + '–' + this.fmtHm(end);
    const out: TimelineBlock[] = [];
    for (const run of this.mergedExisting()) {
      out.push({
        leftPct: pos(run.inicioMin), widthPct: width(run.inicioMin, run.finMin), kind: 'exist',
        label: '+' + this.fmtDur(run.finMin - run.inicioMin), title: 'Registrado ' + range(run.inicioMin, run.finMin)
      });
    }
    if (this.before() > 0) {
      const anchor = this.beforeAnchor();
      out.push({
        leftPct: pos(anchor - this.before()), widthPct: width(anchor - this.before(), anchor), kind: 'new',
        label: '+' + this.fmtDur(this.before()), title: 'Nuevo ' + range(anchor - this.before(), anchor)
      });
    }
    out.push({
      leftPct: pos(b.inicioMin), widthPct: width(b.inicioMin, b.finMin), kind: 'base',
      label: range(b.inicioMin, b.finMin), title: 'Horario base ' + range(b.inicioMin, b.finMin)
    });
    if (this.after() > 0) {
      const anchor = this.afterAnchor();
      out.push({
        leftPct: pos(anchor), widthPct: width(anchor, anchor + this.after()), kind: 'new',
        label: '+' + this.fmtDur(this.after()), title: 'Nuevo ' + range(anchor, anchor + this.after())
      });
    }
    const det = this.detachedRange();
    if (det) {
      out.push({
        leftPct: pos(det.start), widthPct: width(det.start, det.end), kind: 'new',
        label: '+' + this.fmtDur(det.end - det.start), title: 'Nuevo ' + range(det.start, det.end)
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

  private detachedRange(): { start: number; end: number } | null {
    if (!this.detached()) return null;
    const start = this.toMinHm(this.detStart());
    const end = this.toMinHm(this.detEnd());
    if (start === null || end === null || end <= start) return null;
    return { start, end };
  }

  protected readonly detachedInvalid = computed(() => this.detached() && this.detachedRange() === null);

  protected readonly totalExtra = computed(() => {
    let total = this.before() + this.after();
    const det = this.detachedRange();
    if (det) total += det.end - det.start;
    return total;
  });
  protected readonly totalExtraLabel = computed(() => this.fmtDur(this.totalExtra()));
  protected readonly beforeLabel = computed(() => this.fmtDur(this.before()));
  protected readonly afterLabel = computed(() => this.fmtDur(this.after()));
  protected readonly excedeTope = computed(() => {
    const cap = this.maxTotal();
    return cap !== null && this.totalExtra() > cap;
  });
  protected readonly canSave = computed(
    () => this.totalExtra() > 0 && this.motivo().trim().length > 0 && !this.detachedInvalid() && !this.excedeTope() && !this.saving()
  );

  protected adjust(kind: 'before' | 'after', delta: number): void {
    const target = kind === 'before' ? this.before : this.after;
    const max = kind === 'before' ? this.maxBefore() : this.maxAfter();
    target.set(Math.max(0, Math.min(max, target() + delta * this.STEP)));
  }

  protected toggleDetached(): void {
    this.detached.update((value) => !value);
  }

  protected onInput(target: 'detStart' | 'detEnd' | 'motivo', event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this[target].set(value);
  }

  protected emitCancel(): void {
    this.cancel.emit();
  }

  protected save(): void {
    const b = this.base();
    if (!b || !this.canSave()) return;
    const motivo = this.motivo().trim();
    const requests: AjusteJornadaRequest[] = [];
    if (this.before() > 0) {
      const anchor = this.beforeAnchor();
      requests.push(this.segment(b.fecha, anchor - this.before(), anchor, motivo));
    }
    if (this.after() > 0) {
      const anchor = this.afterAnchor();
      requests.push(this.segment(b.fecha, anchor, anchor + this.after(), motivo));
    }
    const det = this.detachedRange();
    if (det) requests.push(this.segment(b.fecha, det.start, det.end, motivo));
    this.saveRequested.emit(requests);
  }

  private resetForm(): void {
    this.before.set(0);
    this.after.set(0);
    this.detached.set(false);
    this.detStart.set('20:00');
    this.detEnd.set('21:30');
    this.motivo.set('');
  }

  private segment(fecha: string, startMin: number, endMin: number, motivo: string): AjusteJornadaRequest {
    return { inicio: `${fecha}T${this.fmtHm(startMin)}:00`, fin: `${fecha}T${this.fmtHm(endMin)}:00`, motivo };
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
    return `${hours}:${String(minutes).padStart(2, '0')}`;
  }
}
