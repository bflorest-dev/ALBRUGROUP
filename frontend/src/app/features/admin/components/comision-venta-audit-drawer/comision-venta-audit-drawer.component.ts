import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import {
  ComisionVentaAuditContext,
} from '../../facades/admin-comision-venta.facade';
import { ComisionVentaAuditEstado, ComisionVentaDetalleLead } from '../../services/admin-comision-venta.service';

@Component({
  selector: 'app-comision-venta-audit-drawer',
  imports: [DatePipe],
  templateUrl: './comision-venta-audit-drawer.component.html',
  styleUrl: './comision-venta-audit-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComisionVentaAuditDrawerComponent implements AfterViewInit {
  @Input({ required: true }) contexto!: ComisionVentaAuditContext;
  @Input() filas: ComisionVentaDetalleLead[] = [];
  @Input() cargando = false;
  @Input() error: string | null = null;
  @Input() estado: ComisionVentaAuditEstado = 'TODOS';
  @Input() totalLeads = 0;
  @Input() totalValidas = 0;
  @Input() totalNoValidas = 0;
  @Input() desde = 0;
  @Input() hasta = 0;
  @Input() totalElementos = 0;
  @Input() pagina = 0;
  @Input() totalPaginas = 0;

  @Output() readonly cerrar = new EventEmitter<void>();
  @Output() readonly reintentar = new EventEmitter<void>();
  @Output() readonly cambiarEstado = new EventEmitter<ComisionVentaAuditEstado>();
  @Output() readonly cambiarPagina = new EventEmitter<number>();

  @ViewChild('closeButton') private closeButton?: ElementRef<HTMLButtonElement>;

  ngAfterViewInit(): void {
    queueMicrotask(() => this.closeButton?.nativeElement.focus());
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.cerrar.emit();
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cerrar.emit();
  }

  protected estadoPagoLabel(estado: string | null): string {
    if (!estado) return 'Sin pago evaluable';
    return estado.toLowerCase().replaceAll('_', ' ').replace(/^./, (letra) => letra.toUpperCase());
  }

  protected vencimientoLabel(tipo: string | null): string {
    if (tipo === 'CONFIRMADO') return 'Confirmado';
    if (tipo === 'ESTIMADO') return 'Estimado';
    return 'Sin registro';
  }

  protected fecha(valor: string | null): string {
    return valor ? valor : 'Sin registro';
  }
}
