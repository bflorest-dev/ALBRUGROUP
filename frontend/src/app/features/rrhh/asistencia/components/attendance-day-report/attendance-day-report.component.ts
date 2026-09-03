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
  open: boolean;     // tramo sin cierre (día pasado sin salida marcada) → estilo rayado
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
  CIERRE_MANUAL: 'Cierre'
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
  private readonly presenceIntervals = computed<{ s: number; e: number; open: boolean }[]>(() => {
    const r = this.reporte();
    if (!r) return [];
    const hoy = !this.isPastDay();
    const now = this.nowMin();
    const last = this.lastEvidenceMin();
    const out: { s: number; e: number; open: boolean }[] = [];
    for (const p of r.presencia ?? []) {
      const s = this.toMin(p.inicio);
      if (s === null) continue;
      let e = this.toMin(p.fin);
      let open = false;
      if (e === null) {
        // Hoy: sigue conectada → hasta ahora. Día pasado sin cierre: hasta la última evidencia (stub rayado).
        open = true;
        e = hoy ? Math.max(s, now) : Math.max(s + 5, last);
      }
      if (e > s) out.push({ s, e, open });
    }
    return out;
  });

  /**
   * Día pasado sin salida marcada: la jornada quedó sin cerrar (obligación del empleado marcar salida).
   * Vale con o sin tramo de presencia abierto: basta que hubo actividad (ingreso/presencia) y no hay salida.
   */
  protected readonly sinSalida = computed(() => {
    const r = this.reporte();
    if (!r || r.jornadaCerrada || !this.isPastDay()) return false;
    return (r.presencia ?? []).length > 0 || (r.tramos ?? []).some((t) => !!t.ingresoReal);
  });

  protected readonly ultimaActividad = computed(() => this.hhmm(this.lastEvidenceMin()));

  protected readonly sinSalidaMsg = computed(() =>
    `Jornada sin cierre: no se marcó salida (última actividad ${this.ultimaActividad()}). No cuenta como falta ni penaliza el balance, pero el empleado debe marcar su salida.`
  );

  protected readonly presenceBlocks = computed<PresBlock[]>(() => {
    const ivs = this.presenceIntervals();
    if (ivs.length === 0) return [];
    const cerrada = !!this.reporte()?.jornadaCerrada;
    const ingreso = Math.min(...ivs.map((x) => x.s));
    const cerrados = ivs.filter((x) => !x.open);
    const salida = cerrados.length ? Math.max(...cerrados.map((x) => x.e)) : -1;
    return ivs.map((iv) => ({
      leftPct: this.pct(iv.s), widthPct: this.pct(iv.e) - this.pct(iv.s), open: iv.open,
      capLeft: iv.s === ingreso ? this.hhmm(iv.s) : '',
      capRight: !iv.open && cerrada && iv.e === salida ? this.hhmm(iv.e) : '',
      title: iv.open
        ? `Conectado desde ${this.hhmm(iv.s)} · sin salida marcada`
        : `Conectado ${this.hhmm(iv.s)}–${this.hhmm(iv.e)}`
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
      // Solo penaliza el balance la desconexión estando ONLINE; en otro estado es informativa.
      const penaliza = (g.estadoAlDesconectar ?? '').toUpperCase() === 'ONLINE';
      const min = g.minutos ?? (b - a);
      out.push({
        leftPct: this.pct(a), widthPct: w, kind: penaliza ? 'dead' : 'soft',
        label: penaliza && w >= 6 ? `−${min}m` : '',
        title: `${this.motivoLabel(g.motivo)} · ${this.hhmm(a)}–${this.hhmm(b)} · ${min} min`
          + (penaliza ? ' · penaliza' : '')
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

  // ── Tarjeta: Tiempos muertos (penaliza vs informativo, altura fija) ─────
  protected readonly deadRows = computed<AggRow[]>(() => {
    let penMin = 0, penCt = 0, infMin = 0, infCt = 0;
    for (const g of this.reporte()?.tiemposMuertos ?? []) {
      if ((g.estadoAlDesconectar ?? '').toUpperCase() === 'ONLINE') { penMin += g.minutos ?? 0; penCt += 1; }
      else { infMin += g.minutos ?? 0; infCt += 1; }
    }
    return [
      { label: 'Penaliza el balance', count: penCt ? `×${penCt}` : '', minutos: penMin, kind: 'dead', active: penCt > 0 },
      { label: 'No penaliza', count: infCt ? `×${infCt}` : '', minutos: infMin, kind: 'soft', active: infCt > 0 }
    ];
  });

  // El total de la tarjeta = solo lo que PENALIZA (desconexión estando ONLINE).
  protected readonly deadTotal = computed(() => {
    let min = 0; let count = 0;
    for (const g of this.reporte()?.tiemposMuertos ?? []) {
      if ((g.estadoAlDesconectar ?? '').toUpperCase() === 'ONLINE') { min += g.minutos ?? 0; count += 1; }
    }
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

  private todayIso(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private isPastDay(): boolean {
    const f = this.reporte()?.fecha;
    return !!f && f < this.todayIso();
  }

  /** Último minuto con evidencia real del día (fin de almuerzo, fin de sesión, salida real, inicio de tramo). */
  private lastEvidenceMin(): number {
    const r = this.reporte();
    const marks: number[] = [];
    this.pushMin(marks, r?.almuerzoRealFin ?? null);
    for (const s of r?.sesiones ?? []) this.pushMin(marks, s.fin);
    for (const t of r?.tramos ?? []) this.pushMin(marks, t.salidaReal);
    for (const p of r?.presencia ?? []) { this.pushMin(marks, p.inicio); this.pushMin(marks, p.fin); }
    return marks.length ? Math.max(...marks) : 0;
  }
}
