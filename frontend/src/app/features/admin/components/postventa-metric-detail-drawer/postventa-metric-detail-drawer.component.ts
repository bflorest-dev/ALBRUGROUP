import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  computed,
  inject,
  signal
} from '@angular/core';
import {
  AdminPostventaMetricDetailService,
  DetalleMetricaPostventa,
  MetricaPostventaContexto
} from '../../services/admin-postventa-metric-detail.service';

type Agrupacion = 'ninguna' | 'estado' | 'tipificacion' | 'subtipificacion' | 'asesor' | 'corte';
const MESES_ABREVIADOS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const MESES_COMPLETOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

@Component({
  selector: 'app-postventa-metric-detail-drawer',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './postventa-metric-detail-drawer.component.html',
  styleUrl: './postventa-metric-detail-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostventaMetricDetailDrawerComponent {
  private readonly service = inject(AdminPostventaMetricDetailService);
  private _contexto: MetricaPostventaContexto | null = null;

  @Input()
  set contexto(value: MetricaPostventaContexto | null) {
    const cambio = value !== this._contexto;
    this._contexto = value;
    if (value && cambio) {
      this.reiniciarYCargar();
    }
  }
  get contexto(): MetricaPostventaContexto | null { return this._contexto; }

  @Output() readonly cerrar = new EventEmitter<void>();

  protected readonly filas = signal<DetalleMetricaPostventa[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly page = signal(0);
  protected readonly pageSize = signal(12);
  protected readonly totalPages = signal(0);
  protected readonly totalElements = signal(0);
  protected readonly buscar = signal('');
  protected readonly estado = signal('');
  protected readonly tipificacion = signal('');
  protected readonly subtipificacion = signal('');
  protected readonly sortBy = signal<'fechaInstalacion' | 'ultimaGestion'>('ultimaGestion');
  protected readonly direction = signal<'asc' | 'desc'>('desc');
  protected readonly agrupacion = signal<Agrupacion>('ninguna');

  protected readonly desde = computed(() => this.totalElements() === 0 ? 0 : this.page() * this.pageSize() + 1);
  protected readonly hasta = computed(() => Math.min((this.page() + 1) * this.pageSize(), this.totalElements()));
  protected readonly grupos = computed(() => agrupar(this.filas(), this.agrupacion()));

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.contexto) this.cerrar.emit();
  }

  protected aplicarFiltros(): void {
    this.page.set(0);
    this.cargar();
  }

  protected limpiarFiltros(): void {
    this.buscar.set('');
    this.estado.set('');
    this.tipificacion.set('');
    this.subtipificacion.set('');
    this.sortBy.set('ultimaGestion');
    this.direction.set('desc');
    this.agrupacion.set('ninguna');
    this.page.set(0);
    this.cargar();
  }

  protected cambiarPagina(delta: number): void {
    const destino = this.page() + delta;
    if (destino < 0 || destino >= this.totalPages()) return;
    this.page.set(destino);
    this.cargar();
  }

  protected estadoLabel(valor: string | null): string {
    return etiqueta(valor);
  }

  protected periodoLabel(valor: string): string {
    const labels: Record<string, string> = {
      ABIERTO: 'Impago',
      CERRADO_PAGO_CLIENTE: 'Pagado por cliente',
      CERRADO_PAGO_EMPRESA: 'Pagado por empresa',
      CERRADO_BAJA: 'Baja',
      CERRADO_BAJA_ADEUDO: 'Baja con adeudo'
    };
    return labels[valor] ?? etiqueta(valor);
  }

  protected referenciaFacturacion(fila: DetalleMetricaPostventa): string {
    const mes = Number(fila.mesCorteBase.slice(5, 7));
    return `${MESES_ABREVIADOS[mes - 1] ?? 'MES'} ${fila.numeroCorte} R${fila.numeroRecibo}`;
  }

  protected referenciaFacturacionAccesible(fila: DetalleMetricaPostventa): string {
    const mes = Number(fila.mesCorteBase.slice(5, 7));
    return `${MESES_COMPLETOS[mes - 1] ?? 'Mes desconocido'}, corte ${fila.numeroCorte}, recibo ${fila.numeroRecibo}`;
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cerrar.emit();
  }

  private reiniciarYCargar(): void {
    this.filas.set([]);
    this.totalElements.set(0);
    this.totalPages.set(0);
    this.error.set(null);
    this.page.set(0);
    this.buscar.set('');
    this.estado.set('');
    this.tipificacion.set('');
    this.subtipificacion.set('');
    this.sortBy.set('ultimaGestion');
    this.direction.set('desc');
    this.agrupacion.set('ninguna');
    this.cargar();
  }

  private cargar(): void {
    const contexto = this.contexto;
    if (!contexto) return;
    this.cargando.set(true);
    this.error.set(null);
    this.service.listar({
      contexto,
      pageNumber: this.page(),
      pageSize: this.pageSize(),
      buscar: this.buscar(),
      estadoPostventa: this.estado(),
      tipificacion: this.tipificacion(),
      subtipificacion: this.subtipificacion(),
      sortBy: this.sortBy(),
      direction: this.direction()
    }).subscribe({
      next: (response) => {
        this.filas.set(response.content);
        this.totalPages.set(response.totalPages);
        this.totalElements.set(response.totalElements);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar estos casos. Revisa los filtros o inténtalo nuevamente.');
        this.cargando.set(false);
      }
    });
  }
}

function agrupar(filas: DetalleMetricaPostventa[], criterio: Agrupacion): Array<{ etiqueta: string | null; filas: DetalleMetricaPostventa[] }> {
  if (criterio === 'ninguna') return [{ etiqueta: null, filas }];
  const grupos = new Map<string, DetalleMetricaPostventa[]>();
  for (const fila of filas) {
    const clave = criterio === 'estado' ? etiqueta(fila.estadoPostventa)
      : criterio === 'tipificacion' ? etiqueta(fila.tipificacion)
      : criterio === 'subtipificacion' ? etiqueta(fila.subtipificacion)
      : criterio === 'asesor' ? (fila.asesorPostventa || 'Sin asesor')
      : `Corte ${fila.numeroCorte}`;
    grupos.set(clave, [...(grupos.get(clave) ?? []), fila]);
  }
  return [...grupos.entries()].map(([nombre, items]) => ({ etiqueta: `${nombre} · ${items.length}`, filas: items }));
}

function etiqueta(valor: string | null): string {
  if (!valor) return 'Sin registro';
  return valor.toLowerCase().replaceAll('_', ' ').replace(/^./, (letra) => letra.toUpperCase());
}
