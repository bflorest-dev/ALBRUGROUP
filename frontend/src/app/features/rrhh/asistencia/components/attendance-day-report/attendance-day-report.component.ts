import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { ReporteDiaResponse } from '../../../../../shared/models/schedule/reporte-dia-response';
import {
  EstadoTramoDia,
  TipoSesionEstado,
  TipoTramoDia
} from '../../../../../shared/models/schedule/detalle-dia-response';

/** Bloque en la línea 1 (Programado): un tramo con su tipo/estado. Si hay ancho, la hora de inicio va
 *  en el extremo izquierdo y la de fin en el derecho; si no, el nombre corto centrado, o nada. */
interface TramoBlock {
  leftPct: number;
  widthPct: number;
  tipo: TipoTramoDia;
  estado: EstadoTramoDia;
  capLeft: string;    // hora de inicio (extremo izquierdo) cuando hay ancho
  capRight: string;   // hora de fin (extremo derecho) cuando hay ancho
  center: string;     // nombre corto centrado para tramos medianos
  title: string;      // tooltip con el detalle completo (hover, fallback)
  anulado: boolean;
}

/** Bloque de presencia en la línea 2: la hora de ingreso/salida va DENTRO, en los extremos. */
interface PresBlock {
  leftPct: number;
  widthPct: number;
  capLeft: string;   // hora de ingreso (solo en el primer tramo conectado)
  capRight: string;  // hora de salida (solo en el último, si la jornada cerró)
  title: string;
}

/** Sub-segmento en la línea 2: almuerzo real o una sesión, con su acumulado adentro. */
interface SegBlock {
  leftPct: number;
  widthPct: number;
  kind: 'lunch' | 'serv' | 'pausa' | 'capa';
  label: string;
  title: string;
}

/** Bloque en la línea 3 (Incidencias): un tiempo muerto o un exceso, con su acumulado adentro. */
interface IncBlock {
  leftPct: number;
  widthPct: number;
  kind: 'dead' | 'soft' | 'exceso';
  label: string;
  title: string;
}

interface AxisTick { leftPct: number; label: string; }

/** Fila agregada de una tarjeta (por motivo o por tipo de estado). */
interface AggRow { label: string; count: string; minutos: number; kind: string; active: boolean; }

interface Interval { s: number; e: number; }

const SESION_LABEL: Record<TipoSesionEstado, string> = {
  SERVICIOS: 'Servicios',
  PAUSA_ACTIVA: 'Pausa activa',
  CAPACITACION: 'Capacitación'
};
const SESION_KIND: Record<TipoSesionEstado, SegBlock['kind']> = {
  SERVICIOS: 'serv',
  PAUSA_ACTIVA: 'pausa',
  CAPACITACION: 'capa'
};
const MOTIVO_LABEL: Record<string, string> = {
  INACTIVIDAD: 'Inactividad',
  CIERRE_MANUAL: 'Cierre manual'
};

/**
 * Detalle del día (admin/RRHH): consume {@link ReporteDiaResponse} y lo pinta como tres líneas de tiempo
 * alineadas al mismo eje —Programado (tramos), Marcaciones (presencia + almuerzo real + sesiones) e
 * Incidencias (tiempos muertos, siempre visible)— más dos tarjetas agregadas por concepto (altura fija) y
 * los totales del día. Presentacional puro, OnPush. La 3ª línea comunica el porqué del desbalance; las
 * etiquetas de la línea siguen una escalera por ancho (inicio–fin solo para lo importante; el resto, el
 * acumulado; los tramos muy angostos, todo al tooltip).
 */
@Component({
  selector: 'app-attendance-day-report',
  imports: [TooltipModule, ProgressSpinnerModule, MessageModule],
  templateUrl: './attendance-day-report.component.html',
  styleUrl: './attendance-day-report.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttendanceDayReportComponent {
  readonly reporte = input<ReporteDiaResponse | null>(null);
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  /** [min, span] del eje en minutos del día, con margen de media hora a cada lado. */
  private readonly axisRange = computed<{ min: number; span: number }>(() => {
    const r = this.reporte();
    const marks: number[] = [];
    for (const t of r?.tramos ?? []) {
      this.pushMin(marks, t.inicio);
      this.pushMin(marks, t.fin);
      this.pushMin(marks, t.ingresoReal);
      this.pushMin(marks, t.salidaReal);
    }
    for (const s of r?.sesiones ?? []) { this.pushMin(marks, s.inicio); this.pushMin(marks, s.fin); }
    for (const g of r?.tiemposMuertos ?? []) { this.pushMin(marks, g.inicio); this.pushMin(marks, g.fin); }
    for (const p of r?.presencia ?? []) { this.pushMin(marks, p.inicio); this.pushMin(marks, p.fin); }
    for (const e of r?.excesos ?? []) { this.pushMin(marks, e.inicio); this.pushMin(marks, e.fin); }
    this.pushMin(marks, r?.inicioAlmuerzoProgramado ?? null);
    this.pushMin(marks, r?.finAlmuerzoProgramado ?? null);
    this.pushMin(marks, r?.almuerzoRealInicio ?? null);
    this.pushMin(marks, r?.almuerzoRealFin ?? null);

    if (marks.length === 0) return { min: 8 * 60, span: 10 * 60 };
    let min = Math.min(...marks);
    let max = Math.max(...marks);
    min = Math.max(0, Math.floor(min / 60) * 60 - 30);
    max = Math.min(24 * 60, Math.ceil(max / 60) * 60 + 30);
    if (max - min < 120) max = Math.min(24 * 60, min + 120);
    return { min, span: max - min };
  });

  protected readonly axisTicks = computed<AxisTick[]>(() => {
    const { min, span } = this.axisRange();
    const step = span > 10 * 60 ? 120 : 60;
    const out: AxisTick[] = [];
    for (let m = Math.ceil(min / step) * step; m <= min + span; m += step) {
      out.push({ leftPct: this.pct(m), label: this.hhmm(m) });
    }
    return out;
  });

  // ── Línea 1: Programado (tramos por tipo/estado) ────────────────────────
  protected readonly tramoBlocks = computed<TramoBlock[]>(() => {
    const blocks: TramoBlock[] = [];
    for (const t of this.reporte()?.tramos ?? []) {
      const a = this.toMin(t.inicio);
      const b = this.toMin(t.fin);
      if (a === null || b === null || b <= a) continue;
      const w = this.pct(b) - this.pct(a);
      const anulado = t.estado === 'ANULADO' || t.estado === 'EXPIRADO';
      const range = `${this.hhmm(a)}–${this.hhmm(b)}`;
      const tipoLabel = this.tramoTipoLabel(t.tipo);
      // Con ancho: inicio a la izquierda, fin a la derecha. Mediano: nombre corto centrado. Angosto: nada.
      const wide = w >= 16;
      blocks.push({
        leftPct: this.pct(a), widthPct: w, tipo: t.tipo, estado: t.estado,
        capLeft: wide ? this.hhmm(a) : '',
        capRight: wide ? this.hhmm(b) : '',
        center: !wide && w >= 7 ? tipoLabel : '',
        anulado,
        title: `${tipoLabel} ${range}` + (anulado ? ' · no acreditado' : ` · ${this.durLabel(t.minutosAcreditados)}`)
      });
    }
    return blocks;
  });

  // ── Línea 1: almuerzo PROGRAMADO (bloque sobre la línea Programado) ──────
  protected readonly lunchProgBlock = computed(() => {
    const r = this.reporte();
    const a = this.toMin(r?.inicioAlmuerzoProgramado ?? null);
    const b = this.toMin(r?.finAlmuerzoProgramado ?? null);
    if (a === null || b === null || b <= a) return null;
    return {
      leftPct: this.pct(a), widthPct: this.pct(b) - this.pct(a),
      title: `Almuerzo programado ${this.hhmm(a)}–${this.hhmm(b)}`
    };
  });

  // ── Línea 2: Marcaciones (presencia autoritativa del backend) ───────────
  private readonly presenceIntervals = computed<Interval[]>(() => {
    const r = this.reporte();
    if (!r) return [];
    const now = this.nowMin();
    const cerrada = !!r.jornadaCerrada;
    const out: Interval[] = [];
    for (const p of r.presencia ?? []) {
      const s = this.toMin(p.inicio);
      if (s === null) continue;
      let e = this.toMin(p.fin);
      if (e === null) e = cerrada ? s : Math.max(s, now); // tramo abierto → hasta ahora
      if (e > s) out.push({ s, e });
    }
    return this.merge(out);
  });

  protected readonly presenceBlocks = computed<PresBlock[]>(() => {
    const ivs = this.presenceIntervals();
    if (ivs.length === 0) return [];
    const cerrada = !!this.reporte()?.jornadaCerrada;
    const ingreso = Math.min(...ivs.map((x) => x.s));
    const salida = Math.max(...ivs.map((x) => x.e));
    return ivs.map((iv) => ({
      leftPct: this.pct(iv.s), widthPct: this.pct(iv.e) - this.pct(iv.s),
      capLeft: iv.s === ingreso ? this.hhmm(iv.s) : '',
      capRight: cerrada && iv.e === salida ? this.hhmm(iv.e) : '',
      title: `Conectado ${this.hhmm(iv.s)}–${this.hhmm(iv.e)}`
    }));
  });

  protected readonly overlaySegments = computed<SegBlock[]>(() => {
    const r = this.reporte();
    if (!r) return [];
    const out: SegBlock[] = [];
    const li = this.toMin(r.almuerzoRealInicio); const lf = this.toMin(r.almuerzoRealFin);
    if (li !== null && lf !== null && lf > li) {
      const w = this.pct(lf) - this.pct(li);
      out.push({
        leftPct: this.pct(li), widthPct: w, kind: 'lunch',
        label: w >= 9 ? this.durLabel(r.minutosAlmuerzoTomados) : '',
        title: `Almuerzo ${this.hhmm(li)}–${this.hhmm(lf)} · ${this.durLabel(r.minutosAlmuerzoTomados)}`
      });
    }
    for (const s of r.sesiones ?? []) {
      const a = this.toMin(s.inicio); const b = this.toMin(s.fin);
      if (a === null || b === null || b <= a) continue;
      const w = this.pct(b) - this.pct(a);
      out.push({
        leftPct: this.pct(a), widthPct: w, kind: SESION_KIND[s.tipo],
        label: w >= 9 ? this.durLabel(s.minutos) : '',
        title: `${SESION_LABEL[s.tipo]} ${this.hhmm(a)}–${this.hhmm(b)} · ${this.durLabel(s.minutos)}`
      });
    }
    return out;
  });

  // ── Línea 3: Incidencias (tiempos muertos + excesos) ────────────────────
  protected readonly incBlocks = computed<IncBlock[]>(() => {
    const out: IncBlock[] = [];
    for (const g of this.reporte()?.tiemposMuertos ?? []) {
      const a = this.toMin(g.inicio); const b = this.toMin(g.fin);
      if (a === null || b === null || b <= a) continue;
      const w = this.pct(b) - this.pct(a);
      const dead = (g.motivo ?? '').toUpperCase() === 'INACTIVIDAD';
      const min = g.minutos ?? (b - a);
      out.push({
        leftPct: this.pct(a), widthPct: w, kind: dead ? 'dead' : 'soft',
        label: w >= 6 ? `−${min}m` : '',
        title: `${this.motivoLabel(g.motivo)} ${this.hhmm(a)}–${this.hhmm(b)} · ${min} min`
          + (g.estadoAlDesconectar ? ` · estaba ${g.estadoAlDesconectar}` : '')
      });
    }
    for (const e of this.reporte()?.excesos ?? []) {
      const a = this.toMin(e.inicio); const b = this.toMin(e.fin);
      if (a === null || b === null || b <= a) continue;
      const w = this.pct(b) - this.pct(a);
      const min = e.minutos ?? (b - a);
      out.push({
        leftPct: this.pct(a), widthPct: w, kind: 'exceso',
        label: w >= 6 ? `+${min}m` : '',
        title: `Exceso de ${this.excesoLabel(e.tipo)} ${this.hhmm(a)}–${this.hhmm(b)} · ${min} min`
      });
    }
    return out;
  });

  protected readonly hasInc = computed(() => this.incBlocks().length > 0);

  // ── Tarjeta: Tiempos muertos (agregado por motivo, altura fija) ─────────
  protected readonly deadRows = computed<AggRow[]>(() => {
    const by = new Map<string, { count: number; min: number }>();
    for (const g of this.reporte()?.tiemposMuertos ?? []) {
      const key = (g.motivo ?? 'OTRO').toUpperCase();
      const acc = by.get(key) ?? { count: 0, min: 0 };
      acc.count += 1; acc.min += g.minutos ?? 0;
      by.set(key, acc);
    }
    // Motivos fijos primero (para que la tarjeta conserve su forma), luego cualquier otro.
    const fixed = ['INACTIVIDAD', 'CIERRE_MANUAL'];
    const keys = [...fixed, ...[...by.keys()].filter((k) => !fixed.includes(k))];
    return keys.map((k) => {
      const acc = by.get(k);
      return {
        label: this.motivoLabel(k),
        count: acc ? `×${acc.count}` : '',
        minutos: acc?.min ?? 0,
        kind: k === 'INACTIVIDAD' ? 'dead' : 'soft',
        active: !!acc
      };
    });
  });

  protected readonly deadTotal = computed(() => {
    let min = 0; let count = 0;
    for (const g of this.reporte()?.tiemposMuertos ?? []) { min += g.minutos ?? 0; count += 1; }
    return { min, count };
  });

  // ── Tarjeta: Sesiones y almuerzo (agregado por tipo, altura fija) ───────
  protected readonly sesionRows = computed<AggRow[]>(() => {
    const by = new Map<TipoSesionEstado, { count: number; min: number }>();
    for (const s of this.reporte()?.sesiones ?? []) {
      const acc = by.get(s.tipo) ?? { count: 0, min: 0 };
      acc.count += 1; acc.min += s.minutos ?? 0;
      by.set(s.tipo, acc);
    }
    const order: TipoSesionEstado[] = ['SERVICIOS', 'PAUSA_ACTIVA', 'CAPACITACION'];
    return order.map((tipo) => {
      const acc = by.get(tipo);
      return {
        label: SESION_LABEL[tipo], count: acc ? `×${acc.count}` : '',
        minutos: acc?.min ?? 0, kind: SESION_KIND[tipo], active: !!acc
      };
    });
  });

  protected readonly almuerzo = computed(() => {
    const r = this.reporte();
    const li = this.toMin(r?.almuerzoRealInicio ?? null); const lf = this.toMin(r?.almuerzoRealFin ?? null);
    return {
      tomado: r?.minutosAlmuerzoTomados ?? 0,
      rango: li !== null && lf !== null ? `${this.hhmm(li)}–${this.hhmm(lf)}` : null,
      active: li !== null
    };
  });

  protected readonly totales = computed(() => {
    const r = this.reporte();
    return {
      objetivo: r?.minutosObjetivoDia ?? 0,
      trabajado: r?.minutosTrabajados ?? 0,
      balance: r?.minutosBalance ?? 0,
      extra: r?.minutosExtra ?? 0,
      compensado: r?.minutosCompensados ?? 0
    };
  });

  protected readonly sinDatos = computed(() => {
    const r = this.reporte();
    return !!r && (r.tramos ?? []).length === 0;
  });

  // ── Helpers de formato ──────────────────────────────────────────────────
  protected durLabel(min: number | null | undefined): string {
    const m = min ?? 0;
    if (m === 0) return '0';
    const h = Math.floor(m / 60); const r = m % 60;
    if (h === 0) return `${r} min`;
    if (r === 0) return `${h} h`;
    return `${h} h ${r} min`;
  }

  protected balanceLabel(min: number): string {
    if (min === 0) return '0';
    const sign = min > 0 ? '+' : '−';
    return sign + this.durLabel(Math.abs(min));
  }

  protected tramoTipoLabel(tipo: TipoTramoDia): string {
    return tipo === 'BASE' ? 'Base' : tipo === 'EXTRA' ? 'Extra' : 'Compensable';
  }

  private motivoLabel(motivo: string | null | undefined): string {
    const key = (motivo ?? '').toUpperCase();
    return MOTIVO_LABEL[key] ?? this.humanize(key || 'Otro');
  }

  private excesoLabel(tipo: string | null | undefined): string {
    const key = (tipo ?? '').toUpperCase();
    if (key === 'ALMUERZO') return 'almuerzo';
    if (key === 'PAUSA_ACTIVA') return 'pausa activa';
    if (key === 'SERVICIOS') return 'servicios';
    return this.humanize(key || 'estado').toLowerCase();
  }

  private humanize(v: string): string {
    return v.toLowerCase().split('_').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  }

  private pct(min: number): number {
    const { min: m0, span } = this.axisRange();
    return ((min - m0) / span) * 100;
  }

  private toMin(iso: string | null | undefined): number | null {
    if (!iso) return null;
    const m = /T(\d{2}):(\d{2})/.exec(iso);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  }

  private pushMin(acc: number[], iso: string | null | undefined): void {
    const v = this.toMin(iso);
    if (v !== null) acc.push(v);
  }

  private hhmm(min: number): string {
    const h = Math.floor(min / 60); const m = min % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private nowMin(): number {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }

  /** Une intervalos solapados/contiguos. */
  private merge(items: Interval[]): Interval[] {
    const sorted = [...items].sort((a, b) => a.s - b.s);
    const out: Interval[] = [];
    for (const iv of sorted) {
      const last = out[out.length - 1];
      if (last && iv.s <= last.e) last.e = Math.max(last.e, iv.e);
      else out.push({ ...iv });
    }
    return out;
  }

}
