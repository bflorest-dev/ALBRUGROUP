import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SessionService } from '../../../../core/services/session.service';
import {
  DashboardVentaService,
  EnfoqueVenta,
  MetricaVentaDetalle,
  VentaDetalleRow
} from '../../services/dashboard-venta.service';

/** Lo que el dashboard pasa al abrir el drawer: qué contador y con qué calificadores + contexto. */
export interface DetalleDrawerReq {
  idProveedor: number;
  metrica: MetricaVentaDetalle;
  enfoque?: EnfoqueVenta;
  zona?: string;
  subtipificacion?: string;
  tipificacion?: string;
  idAsesor?: number;
  desde?: string;
  hasta?: string;
  titulo: string;
  subtitulo: string;
}

interface ColDef {
  key: string;
  label: string;
  kind: 'cliente' | 'tipi' | 'instant' | 'localdate' | 'prog' | 'money' | 'zona' | 'asesor' | 'comment' | 'text';
  group: 'fecha' | 'cliente' | 'dato';
  sortKey?: string;
  adminOnly?: boolean;
  has: (r: VentaDetalleRow) => boolean;
}

type ViewItem = { kind: 'group'; label: string; count: number } | { kind: 'row'; row: VentaDetalleRow };

/** Popover flotante del comentario (posición fija respecto al viewport para no recortarse en la tabla). */
interface CommentPop {
  text: string;
  cliente: string;
  top: number;
  left: number;
}

/** Opciones de agrupación (mapean al whitelist del backend). */
const GROUP_OPTS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Sin agrupar' },
  { value: 'subtipificacion', label: 'Subtipificación' },
  { value: 'tipificacion', label: 'Tipificación' },
  { value: 'zona', label: 'Zona' },
  { value: 'asesorMerito', label: 'Asesor' }
];

const PREFIJOS_LIMA = new Set(['15', '07']);
function zonaLabel(ubigeo: string | null): string {
  if (!ubigeo) return 'Sin ubigeo';
  return PREFIJOS_LIMA.has(ubigeo.slice(0, 2)) ? 'Lima' : 'Provincia';
}
const hasVal = (r: VentaDetalleRow, k: keyof VentaDetalleRow) =>
  r[k] !== null && r[k] !== undefined && r[k] !== '';

@Component({
  selector: 'app-dashboard-venta-detalle-drawer',
  imports: [FormsModule],
  templateUrl: './dashboard-venta-detalle-drawer.component.html',
  styleUrl: './dashboard-venta-detalle-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardVentaDetalleDrawerComponent {
  private readonly service = inject(DashboardVentaService);
  protected readonly esAdmin = inject(SessionService).getPrimaryRole() === 'ADMINISTRADOR';

  @Input() accent = '#3a3f8f';
  @Input() proveedorNombre = '';
  @Input() periodoLabel = '';

  @Input() set request(req: DetalleDrawerReq | null) {
    this._req = req;
    if (req) {
      this.search.set('');
      this.groupBy.set('');
      this.sortBy.set('');
      this.sortDir.set('desc');
      this.page.set(0);
      this.organizeOpen.set(false);
      this.comment.set(null);
      this.visible.set(true);
      void this.load();
    } else {
      this.visible.set(false);
    }
  }
  private _req: DetalleDrawerReq | null = null;

  @Output() closed = new EventEmitter<void>();

  protected readonly groupOpts = GROUP_OPTS;

  protected readonly visible = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal(false);
  protected readonly search = signal('');
  protected readonly groupBy = signal('');
  protected readonly sortBy = signal('');
  protected readonly sortDir = signal<'asc' | 'desc'>('desc');
  protected readonly page = signal(0);
  protected readonly total = signal(0);
  protected readonly totalPages = signal(1);
  private readonly rows = signal<VentaDetalleRow[]>([]);
  private readonly grupos = signal<Record<string, number>>({});

  // Estado de los overlays livianos del drawer.
  protected readonly organizeOpen = signal(false);
  protected readonly comment = signal<CommentPop | null>(null);

  protected readonly pageSize = 25;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  protected titulo = () => this._req?.titulo ?? '';
  protected subtitulo = () => this._req?.subtitulo ?? '';

  // Catálogo de columnas en el orden pedido: FECHAS → CLIENTE → resto. Cada una aparece solo si tiene datos.
  private readonly ALL_COLS: ColDef[] = [
    // ── Fechas (todas ordenables por cabecera) ──
    { key: 'fechaIngresoEtapa', label: 'Ingreso', kind: 'instant', group: 'fecha', sortKey: 'fechaIngresoEtapa', has: (r) => hasVal(r, 'fechaIngresoEtapa') },
    { key: 'fechaProgramacion', label: 'Programación', kind: 'prog', group: 'fecha', sortKey: 'fechaProgramacion', has: (r) => hasVal(r, 'fechaProgramacion') },
    { key: 'fechaInstalacion', label: 'Instalación', kind: 'localdate', group: 'fecha', sortKey: 'fechaInstalacion', has: (r) => hasVal(r, 'fechaInstalacion') },
    { key: 'fechaRechazo', label: 'Rechazo', kind: 'localdate', group: 'fecha', sortKey: 'fechaRechazo', has: (r) => hasVal(r, 'fechaRechazo') },
    { key: 'fechaUltimaGestion', label: 'Últ. gestión', kind: 'instant', group: 'fecha', sortKey: 'fechaUltimaGestion', has: (r) => hasVal(r, 'fechaUltimaGestion') },
    // ── Cliente ──
    { key: 'cliente', label: 'Cliente', kind: 'cliente', group: 'cliente', sortKey: 'nombreCliente', has: () => true },
    { key: 'zona', label: 'Zona', kind: 'zona', group: 'cliente', has: (r) => hasVal(r, 'ubigeo') },
    // ── Resto ──
    { key: 'tipificacion', label: 'Tipificación', kind: 'tipi', group: 'dato', sortKey: 'tipificacion', has: (r) => hasVal(r, 'tipificacion') || hasVal(r, 'subtipificacion') },
    { key: 'asesorMerito', label: 'Asesor', kind: 'asesor', group: 'dato', has: (r) => hasVal(r, 'asesorMerito') },
    { key: 'cargoFijo', label: 'Cargo fijo', kind: 'money', group: 'dato', adminOnly: true, has: (r) => hasVal(r, 'cargoFijo') },
    { key: 'ultimoComentario', label: 'Comentario', kind: 'comment', group: 'dato', has: (r) => hasVal(r, 'ultimoComentario') }
  ];

  protected readonly columns = computed<ColDef[]>(() => {
    const rs = this.rows();
    return this.ALL_COLS.filter((c) => {
      if (c.adminOnly && !this.esAdmin) return false;
      return rs.some((r) => c.has(r));
    });
  });

  // Opciones de "Ordenar por" del panel ORGANIZAR: las columnas ordenables visibles, en su orden natural.
  protected readonly sortOpts = computed<Array<{ value: string; label: string }>>(() =>
    this.columns()
      .filter((c) => c.sortKey)
      .map((c) => ({ value: c.sortKey as string, label: c.label }))
  );

  // Filas con cabeceras de grupo intercaladas (agrupación server-side; el conteo es el global del grupo).
  protected readonly viewRows = computed<ViewItem[]>(() => {
    const rs = this.rows();
    const gb = this.groupBy();
    if (!gb) return rs.map((row) => ({ kind: 'row', row }) as ViewItem);
    const counts = this.grupos();
    const items: ViewItem[] = [];
    let last: string | null = null;
    for (const row of rs) {
      const key = this.groupKeyOf(row, gb);
      if (key !== last) {
        last = key;
        items.push({ kind: 'group', label: key, count: counts[key] ?? 0 });
      }
      items.push({ kind: 'row', row });
    }
    return items;
  });

  private groupKeyOf(r: VentaDetalleRow, gb: string): string {
    if (gb === 'zona') return zonaLabel(r.ubigeo);
    const v = (r as unknown as Record<string, unknown>)[gb];
    return v == null || v === '' ? '(sin dato)' : String(v);
  }

  // Etiqueta legible del criterio de agrupación activo (para el "pill" resumen junto al botón).
  protected readonly groupLabel = computed<string>(
    () => GROUP_OPTS.find((o) => o.value === this.groupBy())?.label ?? 'Sin agrupar'
  );
  protected readonly organizeActive = computed<boolean>(() => !!this.groupBy() || !!this.sortBy());

  // ── acciones ────────────────────────────────────────────────────────────
  protected onSearch(value: string): void {
    this.search.set(value);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.page.set(0);
      void this.load();
    }, 300);
  }

  protected toggleOrganize(): void {
    this.organizeOpen.update((v) => !v);
  }

  protected onGroup(value: string): void {
    this.groupBy.set(value);
    this.page.set(0);
    void this.load();
  }

  protected onSortField(value: string): void {
    this.sortBy.set(value);
    this.page.set(0);
    void this.load();
  }

  protected onSortDir(value: 'asc' | 'desc'): void {
    this.sortDir.set(value);
    this.page.set(0);
    void this.load();
  }

  protected clearOrganize(): void {
    this.groupBy.set('');
    this.sortBy.set('');
    this.sortDir.set('desc');
    this.page.set(0);
    void this.load();
  }

  protected sortByCol(col: ColDef): void {
    if (!col.sortKey) return;
    if (this.sortBy() === col.sortKey) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(col.sortKey);
      this.sortDir.set('desc');
    }
    this.page.set(0);
    void this.load();
  }

  // ── comentario en icono (popover flotante) ────────────────────────────────
  protected openComment(ev: MouseEvent, row: VentaDetalleRow): void {
    ev.stopPropagation();
    const btn = ev.currentTarget as HTMLElement;
    const r = btn.getBoundingClientRect();
    this.comment.set({
      text: row.ultimoComentario ?? '',
      cliente: row.nombreCliente ?? row.numeroDocumento ?? 'Lead',
      top: r.bottom + 8,
      left: Math.min(r.left, window.innerWidth - 340)
    });
  }
  protected closeComment(): void {
    this.comment.set(null);
  }

  protected prev(): void {
    if (this.page() > 0) {
      this.page.set(this.page() - 1);
      void this.load();
    }
  }

  protected next(): void {
    if (this.page() < this.totalPages() - 1) {
      this.page.set(this.page() + 1);
      void this.load();
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.comment()) {
      this.closeComment();
      return;
    }
    if (this.organizeOpen()) {
      this.organizeOpen.set(false);
      return;
    }
    if (this.visible()) this.cerrar();
  }

  protected cerrar(): void {
    this.visible.set(false);
    this.organizeOpen.set(false);
    this.comment.set(null);
    this.closed.emit();
  }

  private async load(): Promise<void> {
    const req = this._req;
    if (!req) return;
    this.loading.set(true);
    this.error.set(false);
    try {
      const resp = await firstValueFrom(
        this.service.obtenerDetalleUnificado({
          idProveedor: req.idProveedor,
          metrica: req.metrica,
          enfoque: req.enfoque,
          zona: req.zona,
          subtipificacion: req.subtipificacion,
          tipificacion: req.tipificacion,
          idAsesor: req.idAsesor,
          desde: req.desde,
          hasta: req.hasta,
          search: this.search(),
          groupBy: this.groupBy() || undefined,
          sortBy: this.sortBy() || undefined,
          direction: this.sortDir(),
          page: this.page(),
          size: this.pageSize
        })
      );
      this.rows.set(resp.content);
      this.total.set(resp.totalElements);
      this.totalPages.set(Math.max(1, resp.totalPages));
      const map: Record<string, number> = {};
      for (const g of resp.grupos ?? []) map[g.valor ?? '(sin dato)'] = g.cantidad;
      this.grupos.set(map);
    } catch {
      this.error.set(true);
      this.rows.set([]);
      this.total.set(0);
      this.grupos.set({});
    } finally {
      this.loading.set(false);
    }
  }

  // ── formato de celdas ───────────────────────────────────────────────────
  private readonly fmtDate = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Lima' });
  private readonly fmtTime = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Lima' });

  protected instantDate(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : this.fmtDate.format(d);
  }
  protected instantTime(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : this.fmtTime.format(d);
  }
  protected localDate(s: string | null): string {
    if (!s) return '—';
    const [y, m, d] = s.split('-');
    return d ? `${d}/${m}/${y}` : s;
  }
  protected localTime(s: string | null): string {
    return s ? s.slice(0, 5) : '';
  }
  protected zona(r: VentaDetalleRow): string {
    return zonaLabel(r.ubigeo);
  }
  protected cellText(r: VentaDetalleRow, key: string): string {
    const v = (r as unknown as Record<string, unknown>)[key];
    return v == null || v === '' ? '—' : String(v);
  }

  /** Alias del asesor: 3 letras del 1er nombre + 3 del 2º (ahorra ancho). Los OJT se muestran solo como "OJT". */
  protected aliasAsesor(nombre: string | null): string {
    if (!nombre || !nombre.trim()) return '—';
    if (/ojt/i.test(nombre)) return 'OJT';
    const partes = nombre.trim().split(/\s+/).filter(Boolean);
    const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1, 3).toLowerCase() : '');
    if (partes.length >= 2) return cap(partes[0]) + cap(partes[1]);
    return cap(partes[0] ?? '');
  }
}
