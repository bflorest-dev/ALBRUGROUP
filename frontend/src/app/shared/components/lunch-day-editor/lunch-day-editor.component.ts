import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  untracked
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';

/**
 * Editor puntual del almuerzo de un día: línea de tiempo GRUESA con el horario base bloqueado y el bloque
 * de almuerzo (amarillo) ubicable DENTRO del base. Permite mover, habilitar (si el día no tenía) o quitar
 * el almuerzo. Presentacional puro: emite {inicio, fin} (o {null, null} = quitar); el padre hace el PATCH.
 */
@Component({
  selector: 'app-lunch-day-editor',
  imports: [FormsModule, ButtonModule],
  templateUrl: './lunch-day-editor.component.html',
  styleUrl: './lunch-day-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LunchDayEditorComponent {
  readonly entrada = input('');           // HH:mm del horario base
  readonly salida = input('');
  readonly inicio = input<string | null>(null); // almuerzo actual (null = el día no tiene)
  readonly fin = input<string | null>(null);
  readonly lunchMinutes = input(60);
  readonly saving = input(false);
  readonly error = input<string | null>(null);

  readonly save = output<{ inicio: string | null; fin: string | null }>();
  readonly cancel = output<void>();

  private readonly STEP = 15;

  protected readonly hasLunch = signal(false);
  protected readonly li = signal('13:00');
  protected readonly lf = signal('14:00');

  constructor() {
    // Al cambiar el día/almuerzo entrante, reinicia el buffer.
    effect(() => {
      const ini = this.inicio();
      const f = this.fin();
      this.entrada();
      this.salida();
      untracked(() => {
        const start = ini ?? this.defaultLunchStart();
        this.hasLunch.set(!!ini);
        this.li.set(start);
        this.lf.set(f ?? shift(start, this.lunchMinutes()));
      });
    });
  }

  protected readonly baseStart = computed(() => toMin(this.entrada()) ?? 9 * 60);
  protected readonly baseEnd = computed(() => {
    const s = this.baseStart();
    return Math.max((toMin(this.salida()) ?? 18 * 60), s + 60);
  });

  protected readonly baseLabel = computed(() => `${hhmm(this.baseStart())} – ${hhmm(this.baseEnd())}`);

  protected readonly ticks = computed(() => {
    const s = this.baseStart();
    const e = this.baseEnd();
    const out: { leftPct: number; label: string }[] = [];
    for (let m = Math.ceil(s / 60) * 60; m <= e; m += 60) {
      out.push({ leftPct: this.pct(m), label: hhmm(m) });
    }
    return out;
  });

  protected readonly lunchLeft = computed(() => this.pct(toMin(this.li()) ?? this.baseStart()));
  protected readonly lunchWidth = computed(() => {
    const a = toMin(this.li());
    const b = toMin(this.lf());
    if (a === null || b === null || b <= a) return 0;
    return this.pct(b) - this.pct(a);
  });

  protected readonly outOfBase = computed(() => {
    if (!this.hasLunch()) return false;
    const a = toMin(this.li());
    const b = toMin(this.lf());
    return a === null || b === null || !(a > this.baseStart() && b > a && this.baseEnd() > b);
  });

  protected readonly canSave = computed(() => !this.outOfBase() && !this.saving());

  protected toggleLunch(value: boolean): void {
    this.hasLunch.set(value);
    if (value && this.outOfBase()) {
      const start = this.defaultLunchStart();
      this.li.set(start);
      this.lf.set(shift(start, this.lunchMinutes()));
    }
  }

  protected onLi(value: string): void {
    this.li.set(value);
    // Mantener la duración al mover el inicio.
    const a = toMin(value);
    const b = toMin(this.lf());
    if (a !== null && b !== null && b <= a) this.lf.set(shift(value, this.lunchMinutes()));
  }

  protected onLf(value: string): void {
    this.lf.set(value);
  }

  protected nudge(which: 'li' | 'lf', dir: -1 | 1): void {
    const sig = which === 'li' ? this.li : this.lf;
    sig.set(shift(sig(), dir * this.STEP));
    if (which === 'li') this.onLi(this.li());
  }

  protected emitSave(): void {
    if (!this.canSave()) return;
    this.save.emit(this.hasLunch() ? { inicio: this.li(), fin: this.lf() } : { inicio: null, fin: null });
  }

  protected emitCancel(): void {
    this.cancel.emit();
  }

  private pct(min: number): number {
    const s = this.baseStart();
    const e = this.baseEnd();
    return e > s ? ((min - s) / (e - s)) * 100 : 0;
  }

  /** Almuerzo por defecto (HH:mm): centrado en el turno, o 13:00 si el turno es muy corto. */
  private defaultLunchStart(): string {
    const s = toMin(this.entrada());
    const e = toMin(this.salida());
    const dur = this.lunchMinutes();
    if (s === null || e === null || e - s <= dur) return '13:00';
    const start = s + Math.round((e - s - dur) / 2 / this.STEP) * this.STEP;
    return hhmm(start);
  }
}

function toMin(value: string | null | undefined): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(value ?? '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

function hhmm(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function shift(value: string, delta: number): string {
  const m = toMin(value);
  if (m === null) return value;
  return hhmm(Math.max(0, Math.min(23 * 60 + 59, m + delta)));
}
