import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';

/** Definición de una columna del modal de detalle. */
export interface DetalleColumna {
  header: string;
  kind: 'text' | 'stack' | 'datetime' | 'dias' | 'comment';
  field?: string; // text / datetime / comment
  primary?: string; // stack (principal, negrita)
  secondary?: string; // stack (secundario, tenue)
  prefixSecondary?: string; // p. ej. '@' para usermeta
  fromField?: string; // dias (fecha inicial)
  toField?: string; // dias (fecha final)
  emphasis?: boolean;
  truncate?: boolean; // corta con elipsis + tooltip (text: el campo; stack: el secundario)
}

type Row = Record<string, unknown>;

/**
 * Modal de detalle (drill-down) del dashboard de VENTA. Genérico: recibe columnas + filas paginadas y las
 * renderiza en un p-dialog oscuro (mismo estilo que el modal de PREVENTA). Soporta columnas apiladas
 * (lead+usermeta, doc+lead, tipi+subtipi), fecha+hora y un cálculo de días.
 */
@Component({
  selector: 'app-dashboard-venta-detalle-modal',
  imports: [DialogModule, PaginatorModule, TooltipModule],
  templateUrl: './dashboard-venta-detalle-modal.component.html',
  styleUrl: './dashboard-venta-detalle-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardVentaDetalleModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() title = '';
  @Input() contextLine = '';
  @Input() accent = '#3a3f8f';
  @Input() columns: DetalleColumna[] = [];
  @Input() rows: Row[] = [];
  @Input() loading = false;
  @Input() error = false;
  @Input() page = 0;
  @Input() size = 25;
  @Input() totalElements = 0;
  @Output() pageChange = new EventEmitter<number>();

  private readonly fmtDate = new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Lima'
  });
  private readonly fmtTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Lima'
  });

  protected has(row: Row, field?: string): boolean {
    const v = field ? row[field] : null;
    return v !== null && v !== undefined && v !== '';
  }

  protected text(row: Row, field?: string): string {
    return this.has(row, field) ? String(row[field as string]) : '—';
  }

  protected fecha(row: Row, field?: string): string {
    if (!this.has(row, field)) return '—';
    const d = new Date(String(row[field as string]));
    return isNaN(d.getTime()) ? '—' : this.fmtDate.format(d);
  }

  protected hora(row: Row, field?: string): string {
    if (!this.has(row, field)) return '';
    const d = new Date(String(row[field as string]));
    return isNaN(d.getTime()) ? '' : this.fmtTime.format(d);
  }

  protected dias(row: Row, from?: string, to?: string): string {
    if (!this.has(row, from) || !this.has(row, to)) return '—';
    const start = new Date(String(row[from as string])).getTime();
    const end = new Date(String(row[to as string])).getTime();
    if (isNaN(start) || isNaN(end)) return '—';
    const d = Math.max(0, Math.round((end - start) / 86400000));
    return d === 1 ? '1 día' : `${d} días`;
  }

  protected onPaginate(event: { page?: number }): void {
    this.pageChange.emit(event.page ?? 0);
  }
}
