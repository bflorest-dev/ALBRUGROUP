import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { GtrWorkspaceFacade } from '../../facades/gtr-workspace.facade';
import { AjusteJornadaRequest } from '../../../../shared/models/schedule/jornada-efectiva-response';

type TimelineBlock = {
  leftPct: number;
  widthPct: number;
  kind: 'base' | 'exist' | 'new';
  label: string;
};

/**
 * Modal de horas extra del GTR (rediseno). Linea de tiempo: el horario base es un bloque bloqueado y solo
 * se AGREGA tiempo extra (ingresar antes / quedarse mas / periodo aparte) — todo AMPLIACION_OPERATIVA
 * aditiva. La ventana se acota al base +/- 4h (bloqueo solo visual). Guarda N tramos = N llamadas.
 */
@Component({
  selector: 'app-gtr-schedule-extension-dialog',
  imports: [ButtonModule, DialogModule],
  templateUrl: './gtr-schedule-extension-dialog.component.html',
  styleUrl: './gtr-schedule-extension-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrScheduleExtensionDialogComponent {
  protected readonly facade = inject(GtrWorkspaceFacade);

  private readonly STEP = 30;
  private readonly MAX = 240; // 4 h a cada extremo

  protected readonly before = signal(0);
  protected readonly after = signal(0);
  protected readonly detached = signal(false);
  protected readonly detStart = signal('20:00');
  protected readonly detEnd = signal('21:30');
  protected readonly motivo = signal('');

  constructor() {
    // Al abrir el modal para un asesor (nuevo target), limpiar el formulario.
    effect(() => {
      const target = this.facade.extensionTarget();
      if (target) {
        untracked(() => this.resetForm());
      }
    });
  }

  protected readonly visible = computed(() => this.facade.activeDialog() === 'schedule-extension');

  private readonly base = computed(() => {
    const jornada = this.facade.extensionJornada();
    const tramo = jornada?.tramos.find((item) => item.base) ?? null;
    if (!jornada || !tramo) {
      return null;
    }
    return { fecha: jornada.fecha, inicioMin: this.toMin(tramo.inicio), finMin: this.toMin(tramo.fin) };
  });

  private readonly existing = computed(() =>
    (this.facade.extensionJornada()?.tramos ?? [])
      .filter((item) => !item.base)
      .map((item) => ({ inicioMin: this.toMin(item.inicio), finMin: this.toMin(item.fin) }))
  );

  protected readonly hasBase = computed(() => this.base() !== null);
  private readonly winStart = computed(() => { const b = this.base(); return b ? b.inicioMin - this.MAX : 0; });
  private readonly winEnd = computed(() => { const b = this.base(); return b ? b.finMin + this.MAX : 24 * 60; });
  protected readonly winStartHm = computed(() => this.fmtHm(this.winStart()));
  protected readonly winEndHm = computed(() => this.fmtHm(this.winEnd()));

  protected readonly blocks = computed<TimelineBlock[]>(() => {
    const b = this.base();
    if (!b) return [];
    const ws = this.winStart();
    const span = this.winEnd() - ws;
    const pos = (min: number) => ((min - ws) / span) * 100;
    const width = (start: number, end: number) => ((end - start) / span) * 100;
    const out: TimelineBlock[] = [];
    for (const extra of this.existing()) {
      out.push({ leftPct: pos(extra.inicioMin), widthPct: width(extra.inicioMin, extra.finMin), kind: 'exist', label: 'Extra' });
    }
    if (this.before() > 0) {
      out.push({ leftPct: pos(b.inicioMin - this.before()), widthPct: width(b.inicioMin - this.before(), b.inicioMin), kind: 'new', label: '+' + this.fmtDur(this.before()) });
    }
    out.push({ leftPct: pos(b.inicioMin), widthPct: width(b.inicioMin, b.finMin), kind: 'base', label: this.fmtHm(b.inicioMin) + '–' + this.fmtHm(b.finMin) });
    if (this.after() > 0) {
      out.push({ leftPct: pos(b.finMin), widthPct: width(b.finMin, b.finMin + this.after()), kind: 'new', label: '+' + this.fmtDur(this.after()) });
    }
    const det = this.detachedRange();
    if (det) {
      out.push({ leftPct: pos(det.start), widthPct: width(det.start, det.end), kind: 'new', label: 'Extra ' + this.fmtHm(det.start) + '–' + this.fmtHm(det.end) });
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
  protected readonly canSave = computed(
    () => this.totalExtra() > 0 && this.motivo().trim().length > 0 && !this.detachedInvalid() && !this.facade.isSavingExtension()
  );

  protected adjust(kind: 'before' | 'after', delta: number): void {
    const target = kind === 'before' ? this.before : this.after;
    target.set(Math.max(0, Math.min(this.MAX, target() + delta * this.STEP)));
  }

  protected toggleDetached(): void {
    this.detached.update((value) => !value);
  }

  protected onInput(target: 'detStart' | 'detEnd' | 'motivo', event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this[target].set(value);
  }

  protected close(): void {
    this.facade.closeScheduleExtension();
  }

  protected save(): void {
    const b = this.base();
    if (!b || !this.canSave()) return;
    const motivo = this.motivo().trim();
    const requests: AjusteJornadaRequest[] = [];
    if (this.before() > 0) requests.push(this.segment(b.fecha, b.inicioMin - this.before(), b.inicioMin, motivo));
    if (this.after() > 0) requests.push(this.segment(b.fecha, b.finMin, b.finMin + this.after(), motivo));
    const det = this.detachedRange();
    if (det) requests.push(this.segment(b.fecha, det.start, det.end, motivo));
    void this.facade.submitScheduleExtension(requests);
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
