import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Input,
  OnChanges,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormGroup } from '@angular/forms';
import { ButtonModule } from 'primeng/button';

interface RawDay {
  index: number;
  dia: string;
  short: string;
  laborable: boolean;
  e: string;
  s: string;
  li: string;
  lf: string;
}

interface DayBar extends RawDay {
  hasWindow: boolean;
  leftPct: number;
  widthPct: number;
  lunchLeftPct: number;
  lunchWidthPct: number;
  showLunch: boolean;
}

const DAY_LABELS: Record<string, string> = {
  LUNES: 'Lunes',
  MARTES: 'Martes',
  MIERCOLES: 'Miércoles',
  JUEVES: 'Jueves',
  VIERNES: 'Viernes',
  SABADO: 'Sábado',
  DOMINGO: 'Domingo'
};

/**
 * Editor de horario semanal (rediseño paso 3). Dos bloques: un editor CONTEXTUAL (bloque 1) que edita
 * "todos los días" (difunde con un botón) o el día seleccionado (en vivo), y una FRANJA semanal visual
 * (bloque 2, solo lectura) que pinta el horario en verde y el almuerzo en amarillo. Opera sobre el
 * FormArray `detalles` de `horarioForm` (fuente de verdad del request); fuerza `modoAvanzado='true'` para
 * que el submit/validador usen los detalles por día y no los pise el modo simple.
 */
@Component({
  selector: 'app-schedule-week-editor',
  imports: [ButtonModule],
  templateUrl: './schedule-week-editor.component.html',
  styleUrl: './schedule-week-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleWeekEditorComponent implements OnChanges {
  @Input({ required: true }) horarioForm!: FormGroup;
  @Input() requiresLunch = true;
  @Input() lunchMinutes = 60;

  private readonly destroyRef = inject(DestroyRef);
  private boundForm: FormGroup | null = null;

  protected readonly rows = signal<RawDay[]>([]);
  protected readonly selected = signal<number | null>(null);

  protected readonly bE = signal('');
  protected readonly bS = signal('');
  protected readonly bLi = signal('');
  protected readonly bLf = signal('');
  protected readonly bLab = signal(true);
  protected readonly error = signal<string | null>(null);

  private prevEntrada: string | null = null;

  protected readonly axis = computed(() => {
    const laborables = this.rows().filter((r) => r.laborable && toMin(r.e) !== null && toMin(r.s) !== null);
    let min = 6 * 60;
    let max = 20 * 60;
    for (const r of laborables) {
      min = Math.min(min, toMin(r.e)!);
      max = Math.max(max, toMin(r.s)!);
    }
    min = Math.max(0, Math.floor(min / 60) * 60);
    max = Math.min(24 * 60, Math.ceil(max / 60) * 60);
    if (max - min < 120) max = Math.min(24 * 60, min + 120);
    return { min, span: max - min };
  });

  protected readonly ticks = computed(() => {
    const { min, span } = this.axis();
    const step = span > 12 * 60 ? 180 : 120;
    const out: { label: string; leftPct: number }[] = [];
    for (let m = Math.ceil(min / step) * step; m <= min + span; m += step) {
      out.push({ label: hhmm(m), leftPct: ((m - min) / span) * 100 });
    }
    return out;
  });

  protected readonly bars = computed<DayBar[]>(() => {
    const { min, span } = this.axis();
    const pct = (m: number) => ((m - min) / span) * 100;
    return this.rows().map((r) => {
      const e = toMin(r.e);
      const s = toMin(r.s);
      const li = toMin(r.li);
      const lf = toMin(r.lf);
      const hasWindow = r.laborable && e !== null && s !== null && s > e;
      const showLunch = hasWindow && li !== null && lf !== null && lf > li;
      return {
        ...r,
        hasWindow,
        leftPct: hasWindow ? pct(e!) : 0,
        widthPct: hasWindow ? pct(s!) - pct(e!) : 0,
        showLunch,
        lunchLeftPct: showLunch ? pct(li!) : 0,
        lunchWidthPct: showLunch ? pct(lf!) - pct(li!) : 0
      };
    });
  });

  protected readonly scopeLabel = computed(() => {
    const i = this.selected();
    return i === null ? 'Editando: todos los días' : `Editando: ${DAY_LABELS[this.rows()[i]?.dia] ?? ''}`;
  });

  ngOnChanges(): void {
    if (this.horarioForm === this.boundForm) return;
    this.boundForm = this.horarioForm;
    this.horarioForm.get('modoAvanzado')?.setValue('true');
    const detalles = this.detalles();
    detalles.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.refresh());
    this.refresh();
    this.resetBufferToPattern();
  }

  private detalles(): FormArray {
    return this.horarioForm.get('detalles') as FormArray;
  }

  private refresh(): void {
    const rows = this.detalles().controls.map((ctrl, index) => {
      const dia = String(ctrl.get('dia')?.value ?? '');
      return {
        index,
        dia,
        short: (DAY_LABELS[dia] ?? dia).slice(0, 3),
        laborable: ctrl.get('laborable')?.value === 'true',
        e: String(ctrl.get('horaEntrada')?.value ?? ''),
        s: String(ctrl.get('horaSalida')?.value ?? ''),
        li: String(ctrl.get('inicioAlmuerzo')?.value ?? ''),
        lf: String(ctrl.get('finAlmuerzo')?.value ?? '')
      } satisfies RawDay;
    });
    this.rows.set(rows);
  }

  /** Deriva el patrón del bloque 1 (modo "todos") desde el primer día laborable con horas. */
  private resetBufferToPattern(): void {
    const base = this.rows().find((r) => r.laborable && r.e) ?? this.rows().find((r) => r.laborable);
    this.bE.set(base?.e ?? '');
    this.bS.set(base?.s ?? '');
    this.bLi.set(this.requiresLunch ? base?.li ?? '' : '');
    this.bLf.set(this.requiresLunch ? base?.lf ?? '' : '');
    this.prevEntrada = base?.e ?? null;
  }

  protected selectDay(index: number): void {
    this.error.set(null);
    if (this.selected() === index) {
      this.selected.set(null);
      this.resetBufferToPattern();
      return;
    }
    this.selected.set(index);
    const r = this.rows()[index];
    this.bE.set(r.e);
    this.bS.set(r.s);
    this.bLi.set(r.li);
    this.bLf.set(r.lf);
    this.bLab.set(r.laborable);
    this.prevEntrada = r.e || null;
  }

  protected onEntrada(value: string): void {
    this.error.set(null);
    const before = toMin(this.prevEntrada);
    const after = toMin(value);
    this.bE.set(value);
    if (before !== null && after !== null && before !== after) {
      const delta = after - before;
      this.bS.set(shift(this.bS(), delta));
      if (this.requiresLunch) {
        this.bLi.set(shift(this.bLi(), delta));
        this.bLf.set(shift(this.bLf(), delta));
      }
    }
    this.prevEntrada = value;
    this.commitIfDay();
  }

  protected onSalida(value: string): void {
    this.error.set(null);
    this.bS.set(value);
    this.commitIfDay();
  }

  protected onLunchStart(value: string): void {
    this.error.set(null);
    this.bLi.set(value);
    if (this.requiresLunch && toMin(value) !== null) {
      this.bLf.set(shift(value, this.lunchMinutes));
    }
    this.commitIfDay();
  }

  protected onLunchEnd(value: string): void {
    this.error.set(null);
    this.bLf.set(value);
    this.commitIfDay();
  }

  protected toggleLaborable(checked: boolean): void {
    const i = this.selected();
    if (i === null) return;
    this.error.set(null);
    this.bLab.set(checked);
    const detalles = this.detalles();
    detalles.controls.forEach((ctrl, index) => {
      if (index === i) {
        ctrl.get('laborable')?.setValue(checked ? 'true' : 'false');
      } else if (!checked) {
        ctrl.get('laborable')?.setValue('true');
      }
    });
  }

  private commitIfDay(): void {
    const i = this.selected();
    if (i === null) return;
    this.writeRow(i);
  }

  private writeRow(index: number): void {
    this.horarioForm.get('modoAvanzado')?.setValue('true');
    const ctrl = this.detalles().at(index);
    ctrl.patchValue({
      horaEntrada: this.bE(),
      horaSalida: this.bS(),
      inicioAlmuerzo: this.requiresLunch ? this.bLi() : '',
      finAlmuerzo: this.requiresLunch ? this.bLf() : ''
    });
    ctrl.markAsDirty();
  }

  protected applyToAll(): void {
    if (!this.bE() || !this.bS() || (this.requiresLunch && (!this.bLi() || !this.bLf()))) {
      this.error.set('Completa entrada, salida' + (this.requiresLunch ? ' y almuerzo' : '') + ' antes de aplicar.');
      return;
    }
    this.error.set(null);
    this.horarioForm.get('modoAvanzado')?.setValue('true');
    this.detalles().controls.forEach((ctrl) => {
      if (ctrl.get('laborable')?.value !== 'true') return;
      ctrl.patchValue({
        horaEntrada: this.bE(),
        horaSalida: this.bS(),
        inicioAlmuerzo: this.requiresLunch ? this.bLi() : '',
        finAlmuerzo: this.requiresLunch ? this.bLf() : ''
      });
      ctrl.markAsDirty();
    });
  }
}

function toMin(value: string | null | undefined): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value ?? '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

function hhmm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function shift(value: string, delta: number): string {
  const m = toMin(value);
  if (m === null) return value;
  const next = Math.max(0, Math.min(23 * 60 + 59, m + delta));
  return hhmm(next);
}
