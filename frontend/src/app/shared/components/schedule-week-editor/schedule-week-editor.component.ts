import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Input,
  OnChanges,
  SimpleChanges,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormGroup } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import {
  CambioJornadaPeriodoResponse,
  JornadaEfectivaPeriodoDiaResponse,
  JornadaEfectivaPeriodoResponse
} from '../../models/schedule/jornada-efectiva-periodo-response';

interface RawDay {
  index: number;
  dia: string;
  short: string;
  date: string | null;
  esHoy: boolean;
  laborable: boolean;
  e: string;
  s: string;
  li: string;
  lf: string;
  empty: boolean;
  restLabel: string | null;
  lunchModified: boolean;
  lunchTooltip: string;
  rowLabel: string;
  segments: TimelineSegment[];
}

type TimelineSegmentKind = 'base' | 'shift' | 'extra' | 'compensation';

interface TimelineSegment {
  key: string;
  kind: TimelineSegmentKind;
  e: string;
  s: string;
  showTimes: boolean;
  tooltip: string;
}

interface DayBar extends RawDay {
  hasWindow: boolean;
  leftPct: number;
  widthPct: number;
  lunchLeftPct: number;
  lunchWidthPct: number;
  showLunch: boolean;
  segments: Array<TimelineSegment & { leftPct: number; widthPct: number }>;
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
  /** Cuando true, el almuerzo se decide POR DÍA (toggle "lleva almuerzo"); si false, es global. */
  @Input() perDayLunch = false;
  @Input() lunchMinutes = 60;
  @Input() showDate = false;
  @Input() showCompensable = false;
  @Input() dateLabel = 'Fecha de inicio';
  /** Fecha mínima seleccionable (ISO yyyy-mm-dd). Por defecto, hoy: nunca se elige un día pasado. */
  @Input() minDate = '';
  /** Cambia cuando el consumidor vuelve a cargar el mismo FormGroup con otra versión. */
  @Input() refreshKey = 0;
  /** Presenta la jornada sin controles ni edición; conserva las barras para lectura y captura. */
  @Input() readOnly = false;
  /** Datos efectivos semanales; cuando no se envían, el componente conserva su comportamiento base. */
  @Input() jornadaPeriodo: JornadaEfectivaPeriodoResponse | null = null;

  private readonly destroyRef = inject(DestroyRef);
  private boundForm: FormGroup | null = null;
  private boundRefreshKey = -1;

  protected readonly rows = signal<RawDay[]>([]);
  protected readonly selected = signal<number | null>(null);

  protected readonly dateValue = signal('');
  protected readonly compensable = signal(true);

  protected readonly bE = signal('');
  protected readonly bS = signal('');
  protected readonly bLi = signal('');
  protected readonly bLf = signal('');
  protected readonly bLab = signal(true);
  /** El buffer actual (día o "todos") lleva almuerzo. Solo aplica cuando perDayLunch. */
  protected readonly bLunch = signal(true);
  protected readonly error = signal<string | null>(null);

  /** ¿Se muestran/escriben los campos de almuerzo para el buffer actual? */
  protected lunchOn(): boolean {
    return !this.perDayLunch || this.bLunch();
  }

  private prevEntrada: string | null = null;

  protected readonly axis = computed(() => {
    const laborables = this.rows().flatMap((r) => {
      const times = r.segments.length
        ? r.segments.flatMap((segment) => [segment.e, segment.s])
        : [r.e, r.s];
      return r.laborable ? times : [];
    });
    let min = 6 * 60;
    let max = 20 * 60;
    for (const value of laborables) {
      const minutes = toMin(value);
      if (minutes === null) continue;
      min = Math.min(min, minutes);
      max = Math.max(max, minutes);
    }
    for (const row of this.rows()) {
      const lunchStart = toMin(row.li);
      const lunchEnd = toMin(row.lf);
      if (lunchStart !== null) min = Math.min(min, lunchStart);
      if (lunchEnd !== null) max = Math.max(max, lunchEnd);
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
      const segments = (r.segments.length ? r.segments : e !== null && s !== null && s > e
        ? [{
            key: `${r.index}-base`,
            kind: 'base' as const,
            e: r.e,
            s: r.s,
            showTimes: true,
            tooltip: `Horario base: ${r.e}–${r.s}`
          }]
        : [])
        .flatMap((segment) => {
          const start = toMin(segment.e);
          const end = toMin(segment.s);
          if (start === null || end === null || end <= start) return [];
          return [{
            ...segment,
            leftPct: pct(start),
            widthPct: pct(end) - pct(start)
          }];
        });
      const hasWindow = segments.length > 0;
      const showLunch = hasWindow && li !== null && lf !== null && lf > li;
      return {
        ...r,
        hasWindow,
        leftPct: hasWindow ? segments[0].leftPct : 0,
        widthPct: hasWindow ? segments[0].widthPct : 0,
        showLunch,
        lunchLeftPct: showLunch ? pct(li!) : 0,
        lunchWidthPct: showLunch ? pct(lf!) - pct(li!) : 0,
        segments
      };
    });
  });

  protected readonly scopeLabel = computed(() => {
    const i = this.selected();
    return i === null ? 'Editando: todos los días' : `Editando: ${DAY_LABELS[this.rows()[i]?.dia] ?? ''}`;
  });

  ngOnChanges(changes: SimpleChanges): void {
    const formChanged = this.horarioForm !== this.boundForm;
    const refreshRequested = this.refreshKey !== this.boundRefreshKey;
    const periodChanged = 'jornadaPeriodo' in changes;
    if (!formChanged && !refreshRequested && !periodChanged) return;
    this.boundRefreshKey = this.refreshKey;
    if (formChanged) {
      this.boundForm = this.horarioForm;
      this.forceAdvanced();
      const detalles = this.detalles();
      detalles.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        // Cualquier cambio de detalles (populate/reset del facade, preset por modalidad, edición) reafirma
        // el modo por día: asi el submit usa siempre los detalles y no los pisa el modo simple.
        this.forceAdvanced();
        this.refresh();
      });
    }
    this.refresh();
    this.selected.set(null);
    this.resetBufferToPattern();
    const iso = toIsoDate(String(this.horarioForm.get('fechaInicio')?.value ?? ''));
    this.dateValue.set(iso);
    this.compensable.set(this.horarioForm.get('compensable')?.value === 'true');
  }

  /** Fecha mínima efectiva (ISO): la provista, o hoy cuando se muestra el selector de fecha. */
  protected minAttr(): string {
    if (!this.showDate) return '';
    return this.minDate || todayIso();
  }

  protected onDate(value: string): void {
    const min = this.minAttr();
    const next = min && value && value < min ? min : value;
    const ctrl = this.horarioForm.get('fechaInicio');
    ctrl?.setValue(next);
    ctrl?.markAsDirty();
    this.dateValue.set(next);
  }

  protected setCompensable(value: boolean): void {
    this.horarioForm.get('compensable')?.setValue(value ? 'true' : 'false');
    this.compensable.set(value);
  }

  private detalles(): FormArray {
    return this.horarioForm.get('detalles') as FormArray;
  }

  /** Fuerza el modo por día (sin emitir): el submit/validador usan los detalles, no el modo simple. */
  private forceAdvanced(): void {
    const ctrl = this.horarioForm.get('modoAvanzado');
    if (ctrl && ctrl.value !== 'true') {
      ctrl.setValue('true', { emitEvent: false });
    }
  }

  private refresh(): void {
    if (this.readOnly && this.jornadaPeriodo) {
      this.rows.set(this.periodRows(this.jornadaPeriodo));
      return;
    }
    const rows = this.detalles().controls.map((ctrl, index) => {
      const dia = String(ctrl.get('dia')?.value ?? '');
      const laborable = ctrl.get('laborable')?.value === 'true';
      const e = hhmm5(String(ctrl.get('horaEntrada')?.value ?? ''));
      const s = hhmm5(String(ctrl.get('horaSalida')?.value ?? ''));
      const li = hhmm5(String(ctrl.get('inicioAlmuerzo')?.value ?? ''));
      const lf = hhmm5(String(ctrl.get('finAlmuerzo')?.value ?? ''));
      return {
        index,
        dia,
        short: (DAY_LABELS[dia] ?? dia).slice(0, 3),
        date: null,
        esHoy: dia === dayOfWeek(todayIso()),
        laborable,
        e,
        s,
        li,
        lf,
        empty: false,
        restLabel: laborable ? null : 'Descanso',
        lunchModified: false,
        lunchTooltip: li && lf ? `Almuerzo: ${li}–${lf}` : 'Sin almuerzo',
        rowLabel: `${DAY_LABELS[dia] ?? dia}: ${laborable ? `${e}–${s}` : 'Descanso'}`,
        segments: []
      } satisfies RawDay;
    });
    this.rows.set(rows);
  }

  private periodRows(periodo: JornadaEfectivaPeriodoResponse): RawDay[] {
    return periodo.dias.map((day, index) => this.periodRow(day, index));
  }

  private periodRow(day: JornadaEfectivaPeriodoDiaResponse, index: number): RawDay {
    const base = day.horarioBase;
    const baseStart = timeOnly(base?.inicio);
    const baseEnd = timeOnly(base?.fin);
    const lunchStart = timeOnly(day.almuerzo?.inicioEfectivo ?? base?.almuerzoInicio);
    const lunchEnd = timeOnly(day.almuerzo?.finEfectivo ?? base?.almuerzoFin);
    const additionalRest = Boolean(
      base?.laborable
      && !day.jornadaEfectiva.laborable
      && day.cambios.some((change) =>
        change.tipo === 'DIA_NO_LABORABLE' || (change.tipo === 'EXCEPCION_HORARIO' && change.codigo === 'DIA_LIBRE'))
    );
    const segments: TimelineSegment[] = [];
    const replacesBase = day.jornadaEfectiva.tramos.some((tramo) => {
      const change = tramo.idAjuste === null
        ? day.cambios.find((item) => item.tipo === 'EXCEPCION_HORARIO')
        : day.cambios.find((item) => item.id === tramo.idAjuste);
      return tramo.origen === 'REEMPLAZO_BASE'
        || tramo.razon?.startsWith('CORRIMIENTO')
        || change?.tipo === 'EXCEPCION_HORARIO';
    });
    if (base?.laborable && baseStart && baseEnd && !additionalRest && !replacesBase) {
      segments.push({
        key: `${index}-base`,
        kind: 'base',
        e: baseStart,
        s: baseEnd,
        showTimes: true,
        tooltip: `Horario base: ${baseStart}–${baseEnd}`
      });
    }

    for (const tramo of day.jornadaEfectiva.tramos) {
      const start = timeOnly(tramo.inicio);
      const end = timeOnly(tramo.fin);
      if (!start || !end || (tramo.idAjuste === null && sameTime(start, baseStart) && sameTime(end, baseEnd))) continue;
      const change = tramo.idAjuste === null
        ? day.cambios.find((item) => item.tipo === 'EXCEPCION_HORARIO')
        : day.cambios.find((item) => item.id === tramo.idAjuste);
      const kind = this.segmentKind(tramo.razon, tramo.origen, change);
      segments.push({
        key: `${index}-${kind}-${tramo.idAjuste ?? start}`,
        kind,
        e: start,
        s: end,
        showTimes: kind === 'shift',
        tooltip: this.segmentTooltip(kind, start, end, tramo.motivo, change)
      });
    }

    const dayName = DAY_LABELS[dayOfWeek(day.fecha)] ?? day.fecha;
    const restLabel = additionalRest
      ? 'Descanso adicional'
      : day.estado === 'SIN_HORARIO'
        ? null
        : day.jornadaEfectiva.laborable ? null : 'Descanso';
    const empty = day.estado === 'SIN_HORARIO';
    const lunchTooltip = this.lunchTooltip(day, lunchStart, lunchEnd);
    return {
      index,
      dia: dayOfWeek(day.fecha),
      short: (DAY_LABELS[dayOfWeek(day.fecha)] ?? day.fecha).slice(0, 3),
      date: day.fecha,
      esHoy: day.esHoy,
      laborable: day.jornadaEfectiva.laborable,
      e: baseStart ?? '',
      s: baseEnd ?? '',
      li: lunchStart ?? '',
      lf: lunchEnd ?? '',
      empty,
      restLabel,
      lunchModified: day.almuerzo?.modificado ?? false,
      lunchTooltip,
      rowLabel: `${dayName}: ${restLabel ?? (segments.length ? 'Horario programado' : 'Sin cambios')}`,
      segments
    };
  }

  private segmentKind(
    razon: string | null,
    origen: string | null,
    change: CambioJornadaPeriodoResponse | undefined
  ): TimelineSegmentKind {
    if (razon === 'COMPENSACION') return 'compensation';
    if (razon === 'AMPLIACION_OPERATIVA' || origen === 'JORNADA_EXTRAORDINARIA' || origen === 'TRAMO_ADICIONAL') {
      return 'extra';
    }
    return change?.tipo === 'EXCEPCION_HORARIO' || razon?.startsWith('CORRIMIENTO') || origen === 'REEMPLAZO_BASE'
      ? 'shift'
      : 'extra';
  }

  private segmentTooltip(
    kind: TimelineSegmentKind,
    start: string,
    end: string,
    motivo: string | null,
    change: CambioJornadaPeriodoResponse | undefined
  ): string {
    const label = kind === 'shift' ? 'Horario corrido' : kind === 'compensation' ? 'Compensación' : 'Horas extra';
    const reason = change?.razon ? ` · ${reasonLabel(change.razon)}` : motivo ? ` · ${motivo}` : '';
    return `${label}: ${start}–${end}${reason}`;
  }

  private lunchTooltip(day: JornadaEfectivaPeriodoDiaResponse, start: string | null, end: string | null): string {
    if (!start || !end) return 'Sin almuerzo programado';
    if (!day.almuerzo?.modificado) return `Almuerzo: ${start}–${end}`;
    const baseStart = timeOnly(day.almuerzo.inicioBase);
    const baseEnd = timeOnly(day.almuerzo.finBase);
    if (!baseStart || !baseEnd) return `Almuerzo adicional: ${start}–${end}`;
    return baseStart && baseEnd
      ? `Almuerzo modificado: ${start}–${end} · antes ${baseStart}–${baseEnd}`
      : `Almuerzo programado: ${start}–${end}`;
  }

  /** Deriva el patrón del bloque 1 (modo "todos") desde el primer día laborable con horas. */
  private resetBufferToPattern(): void {
    const base = this.rows().find((r) => r.laborable && r.e) ?? this.rows().find((r) => r.laborable);
    this.bE.set(base?.e ?? '');
    this.bS.set(base?.s ?? '');
    this.bLi.set(base?.li ?? '');
    this.bLf.set(base?.lf ?? '');
    this.bLunch.set(this.perDayLunch ? !!(base?.li && base?.lf) : true);
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
    this.bLunch.set(this.perDayLunch ? !!(r.li && r.lf) : true);
    this.prevEntrada = r.e || null;
  }

  /** Toggle "lleva almuerzo" del buffer actual (día o todos). Al encender sin horas, pone un default. */
  protected toggleLunch(checked: boolean): void {
    this.error.set(null);
    this.bLunch.set(checked);
    if (checked) {
      if (!this.bLi()) this.bLi.set('13:00');
      if (!this.bLf()) this.bLf.set(shift(this.bLi() || '13:00', this.lunchMinutes));
    }
    this.commitIfDay();
  }

  protected onEntrada(value: string): void {
    this.error.set(null);
    const before = toMin(this.prevEntrada);
    const after = toMin(value);
    this.bE.set(value);
    if (before !== null && after !== null && before !== after) {
      const delta = after - before;
      this.bS.set(shift(this.bS(), delta));
      if (this.lunchOn()) {
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
    if (toMin(value) !== null) {
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
    this.forceAdvanced();
    const ctrl = this.detalles().at(index);
    ctrl.patchValue({
      horaEntrada: this.bE(),
      horaSalida: this.bS(),
      inicioAlmuerzo: this.lunchOn() ? this.bLi() : '',
      finAlmuerzo: this.lunchOn() ? this.bLf() : ''
    });
    ctrl.markAsDirty();
  }

  protected applyToAll(): void {
    if (!this.bE() || !this.bS() || (this.lunchOn() && (!this.bLi() || !this.bLf()))) {
      this.error.set('Completa entrada, salida' + (this.lunchOn() ? ' y almuerzo' : '') + ' antes de aplicar.');
      return;
    }
    this.error.set(null);
    this.forceAdvanced();
    this.detalles().controls.forEach((ctrl) => {
      if (ctrl.get('laborable')?.value !== 'true') return;
      ctrl.patchValue({
        horaEntrada: this.bE(),
        horaSalida: this.bS(),
        inicioAlmuerzo: this.lunchOn() ? this.bLi() : '',
        finAlmuerzo: this.lunchOn() ? this.bLf() : ''
      });
      ctrl.markAsDirty();
    });
  }
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toIsoDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}

/** Normaliza HH:MM:SS → HH:MM (los horarios del backend traen segundos). */
function hhmm5(value: string): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(value);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : value;
}

function timeOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  const m = /(\d{1,2}):(\d{2})/.exec(value);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : null;
}

function sameTime(left: string | null, right: string | null): boolean {
  return !!left && !!right && left === right;
}

function dayOfWeek(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
  return days[date.getDay()] ?? '';
}

function reasonLabel(value: string): string {
  return {
    AMPLIACION_OPERATIVA: 'horas extra',
    COMPENSACION: 'compensación',
    CORRIMIENTO_COMPENSABLE: 'corrimiento compensable',
    CORRIMIENTO_JUSTIFICADA: 'corrimiento justificado'
  }[value] ?? value;
}

function toMin(value: string | null | undefined): number | null {
  // Tolera HH:MM y HH:MM:SS (los horarios del backend traen segundos).
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value ?? '');
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
