import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import {
  BuscadorUniversalFilter,
  BuscadorUniversalService,
  ColumnaGrupo,
  ColumnaInfo
} from '../../services/buscador-universal.service';

@Component({
  selector: 'app-admin-buscador-universal-page',
  imports: [FormsModule, SelectModule, DatePickerModule],
  templateUrl: './admin-buscador-universal-page.component.html',
  styleUrl: './admin-buscador-universal-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminBuscadorUniversalPageComponent implements OnInit {
  private readonly service = inject(BuscadorUniversalService);

  readonly columnGroups = signal<ColumnaGrupo[]>([]);
  readonly selectedColumns = signal<Set<string>>(new Set());
  readonly showColumnDialog = signal(false);

  readonly q = signal('');
  readonly etapa = signal<string | null>(null);
  readonly estado = signal<string | null>(null);
  readonly anclaFecha = signal<string>('CREATED_AT');
  readonly fechaDesde = signal<Date | null>(null);
  readonly fechaHasta = signal<Date | null>(null);

  readonly etapaOptions = [
    { label: 'Todas', value: null },
    { label: 'Preventa', value: 'PREVENTA' },
    { label: 'Venta', value: 'VENTA' },
    { label: 'Postventa', value: 'POSTVENTA' }
  ];

  readonly estadoOptions = [
    { label: 'Todos', value: null },
    { label: 'Por gestionar', value: 'POR_GESTIONAR' },
    { label: 'Agendado', value: 'AGENDADO' },
    { label: 'En proceso', value: 'EN_PROCESO' },
    { label: 'Cerrado', value: 'CERRADO' }
  ];

  readonly anclaFechaOptions = [
    { label: 'Primer registro', value: 'CREATED_AT' },
    { label: 'Ultimo registro', value: 'LAST_ENTRY_AT' },
    { label: 'Instalacion', value: 'FECHA_INSTALACION' },
    { label: 'Programacion', value: 'FECHA_PROGRAMACION' },
    { label: 'Grabacion', value: 'FECHA_GRABACION' },
    { label: 'Registro CRM', value: 'FECHA_REGISTRO_CRM' }
  ];

  readonly isLoading = signal(false);
  readonly isLoadingColumns = signal(false);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(0);
  readonly pageSize = signal(20);
  readonly error = signal<string | null>(null);
  readonly searchDone = signal(false);

  readonly activeColumns = computed(() => {
    const sel = this.selectedColumns();
    const all: ColumnaInfo[] = [];
    for (const g of this.columnGroups()) {
      for (const c of g.columnas) {
        if (sel.has(c.key)) all.push(c);
      }
    }
    return all;
  });

  readonly totalPages = computed(() => Math.ceil(this.totalElements() / this.pageSize()));

  protected readonly Math = Math;

  ngOnInit(): void {
    this.loadColumns();
  }

  private loadColumns(): void {
    this.isLoadingColumns.set(true);
    this.service.listarColumnas().subscribe({
      next: (groups) => {
        this.columnGroups.set(groups);
        const defaults = new Set(['TELEFONO', 'ETAPA', 'ESTADO', 'ASESOR', 'PROVEEDOR', 'CAMPANA']);
        this.selectedColumns.set(defaults);
        this.isLoadingColumns.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las columnas');
        this.isLoadingColumns.set(false);
      }
    });
  }

  toggleColumn(key: string): void {
    const current = new Set(this.selectedColumns());
    if (current.has(key)) {
      current.delete(key);
    } else {
      current.add(key);
    }
    this.selectedColumns.set(current);
  }

  isColumnSelected(key: string): boolean {
    return this.selectedColumns().has(key);
  }

  toggleAllGroup(grupo: ColumnaGrupo): void {
    const current = new Set(this.selectedColumns());
    const allSelected = grupo.columnas.every(c => current.has(c.key));
    for (const c of grupo.columnas) {
      if (allSelected) {
        current.delete(c.key);
      } else {
        current.add(c.key);
      }
    }
    this.selectedColumns.set(current);
  }

  isGroupAllSelected(grupo: ColumnaGrupo): boolean {
    return grupo.columnas.every(c => this.selectedColumns().has(c.key));
  }

  countGroupSelected(grupo: ColumnaGrupo): number {
    return grupo.columnas.filter(c => this.selectedColumns().has(c.key)).length;
  }

  buscar(): void {
    this.page.set(0);
    this.executeSearch();
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.buscar();
    }
  }

  changePage(newPage: number): void {
    this.page.set(newPage);
    this.executeSearch();
  }

  private executeSearch(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const filter: BuscadorUniversalFilter = {};

    if (this.q().trim()) filter.q = this.q().trim();
    if (this.etapa()) filter.etapa = this.etapa()!;
    if (this.estado()) filter.estado = this.estado()!;

    if (this.fechaDesde() || this.fechaHasta()) {
      filter.anclaFecha = this.anclaFecha();
      if (this.fechaDesde()) {
        filter.fechaDesde = this.fechaDesde()!.toISOString();
      }
      if (this.fechaHasta()) {
        const h = new Date(this.fechaHasta()!);
        h.setHours(23, 59, 59, 999);
        filter.fechaHasta = h.toISOString();
      }
    }

    const cols = [...this.selectedColumns()];
    if (cols.length) filter.columnas = cols;

    this.service.buscar(filter, this.page(), this.pageSize()).subscribe({
      next: (res) => {
        this.rows.set(res.content);
        this.totalElements.set(res.totalElements);
        this.isLoading.set(false);
        this.searchDone.set(true);
      },
      error: () => {
        this.error.set('Error al buscar leads');
        this.isLoading.set(false);
      }
    });
  }

  cellValue(row: Record<string, unknown>, key: string): string {
    const val = row[key];
    if (val == null) return '—';
    if (typeof val === 'boolean') return val ? 'Si' : 'No';
    return String(val);
  }
}
