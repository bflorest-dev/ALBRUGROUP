import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PersonalDirectoryRow } from '../../facades/personal-workspace.facade';
import {
  EmpleadoExportInfo,
  ExportReporteAsistenciaRequest,
  ReporteAsistenciaService
} from '../../services/reporte-asistencia.service';
import { ConsultaCumplimientoRequest } from '../../../../shared/models/schedule/consulta-cumplimiento-request';
import { CumplimientoResumenEmpleadoResponse } from '../../../../shared/models/schedule/cumplimiento-response';

type DrawerStep = 'select' | 'period' | 'preview';

interface SelectableRow {
  row: PersonalDirectoryRow;
  selected: boolean;
}

@Component({
  selector: 'app-attendance-report-drawer',
  imports: [FormsModule],
  templateUrl: './attendance-report-drawer.component.html',
  styleUrl: './attendance-report-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttendanceReportDrawerComponent {
  private readonly reportService = inject(ReporteAsistenciaService);

  readonly visible = input(false);
  readonly theme = input<'light' | 'dark'>('light');
  readonly employees = input<PersonalDirectoryRow[]>([]);
  readonly closed = output<void>();

  protected readonly step = signal<DrawerStep>('select');
  protected readonly searchTerm = signal('');
  protected readonly selectedIds = signal(new Set<number>());

  protected readonly desde = signal(this.defaultDesde());
  protected readonly hasta = signal(this.defaultHasta());

  protected readonly loading = signal(false);
  protected readonly exporting = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly resumenData = signal<CumplimientoResumenEmpleadoResponse[]>([]);

  protected readonly categories = computed(() => {
    const rows = this.employees();
    const term = this.searchTerm().trim().toLowerCase();
    const groups = new Map<string, SelectableRow[]>();
    const selectedIds = this.selectedIds();

    for (const row of rows) {
      if (row.employee.estadoOperativo !== 'ACTIVO') continue;
      if (term) {
        const fullName = `${row.employee.nombres} ${row.employee.apellidos}`.toLowerCase();
        const dni = (row.employee.numeroDocumento ?? '').toLowerCase();
        if (!fullName.includes(term) && !dni.includes(term)) continue;
      }
      const cat = row.category === 'SIN_CATEGORIA' ? 'Sin categoría' : this.categoryLabel(row.category);
      const list = groups.get(cat) ?? [];
      list.push({ row, selected: selectedIds.has(row.employee.idEmpleado) });
      groups.set(cat, list);
    }

    return [...groups.entries()]
      .map(([label, items]) => ({
        label,
        items,
        allSelected: items.every((i) => i.selected),
        someSelected: items.some((i) => i.selected) && !items.every((i) => i.selected)
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  });

  protected readonly selectedCount = computed(() => this.selectedIds().size);

  protected readonly selectedRows = computed(() => {
    const ids = this.selectedIds();
    return this.employees().filter((r) => ids.has(r.employee.idEmpleado));
  });

  protected readonly resumenByEmployee = computed(() => {
    const map = new Map<number, CumplimientoResumenEmpleadoResponse>();
    for (const r of this.resumenData()) map.set(r.idEmpleado, r);
    return map;
  });

  protected close(): void {
    this.reset();
    this.closed.emit();
  }

  protected toggleEmployee(id: number): void {
    this.selectedIds.update((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  protected toggleCategory(items: SelectableRow[]): void {
    const allSelected = items.every((i) => i.selected);
    this.selectedIds.update((current) => {
      const next = new Set(current);
      for (const item of items) {
        allSelected ? next.delete(item.row.employee.idEmpleado) : next.add(item.row.employee.idEmpleado);
      }
      return next;
    });
  }

  protected selectAll(): void {
    const all = new Set<number>();
    for (const cat of this.categories()) {
      for (const item of cat.items) all.add(item.row.employee.idEmpleado);
    }
    this.selectedIds.set(all);
  }

  protected clearAll(): void {
    this.selectedIds.set(new Set());
  }

  protected goToPeriod(): void {
    this.step.set('period');
  }

  protected goBackToSelect(): void {
    this.step.set('select');
  }

  protected setPreset(preset: 'last-month' | 'current-month' | 'last-fortnight'): void {
    const now = new Date();
    if (preset === 'last-month') {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      this.desde.set(this.formatDate(first));
      this.hasta.set(this.formatDate(last));
    } else if (preset === 'current-month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      this.desde.set(this.formatDate(first));
      this.hasta.set(this.formatDate(now));
    } else {
      const twoWeeksAgo = new Date(now);
      twoWeeksAgo.setDate(now.getDate() - 14);
      this.desde.set(this.formatDate(twoWeeksAgo));
      this.hasta.set(this.formatDate(now));
    }
  }

  protected async generateReport(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      const request: ConsultaCumplimientoRequest = {
        empleadoIds: [...this.selectedIds()],
        desde: this.desde(),
        hasta: this.hasta()
      };
      const res = await new Promise<import('../../../../shared/models/schedule/cumplimiento-response').CumplimientoResumenResponse>((resolve, reject) => {
        this.reportService.getCumplimientoResumen(request).subscribe({ next: resolve, error: reject });
      });
      this.resumenData.set(res.empleados);
      this.step.set('preview');
    } catch {
      this.errorMessage.set('Error al generar el reporte. Intenta nuevamente.');
    } finally {
      this.loading.set(false);
    }
  }

  protected async downloadExcel(): Promise<void> {
    this.exporting.set(true);
    this.errorMessage.set('');
    try {
      const empleados: EmpleadoExportInfo[] = this.selectedRows().map((r) => ({
        id: r.employee.idEmpleado,
        nombre: `${r.employee.nombres} ${r.employee.apellidos}`,
        dni: r.employee.numeroDocumento ?? '',
        categoria: r.category === 'SIN_CATEGORIA' ? '' : r.category,
        rol: r.primaryRole ?? ''
      }));
      const request: ExportReporteAsistenciaRequest = {
        desde: this.desde(),
        hasta: this.hasta(),
        empleados
      };
      const blob = await new Promise<Blob>((resolve, reject) => {
        this.reportService.exportExcel(request).subscribe({ next: resolve, error: reject });
      });
      const filename = `reporte-asistencias-${this.desde()}-${this.hasta()}.xlsx`;
      this.reportService.downloadBlob(blob, filename);
    } catch {
      this.errorMessage.set('Error al descargar el Excel. Intenta nuevamente.');
    } finally {
      this.exporting.set(false);
    }
  }

  protected goBackToPeriod(): void {
    this.step.set('period');
  }

  protected periodValid(): boolean {
    return !!this.desde() && !!this.hasta() && this.desde() <= this.hasta();
  }

  private reset(): void {
    this.step.set('select');
    this.searchTerm.set('');
    this.selectedIds.set(new Set());
    this.desde.set(this.defaultDesde());
    this.hasta.set(this.defaultHasta());
    this.resumenData.set([]);
    this.loading.set(false);
    this.exporting.set(false);
    this.errorMessage.set('');
  }

  private defaultDesde(): string {
    const now = new Date();
    return this.formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  }

  private defaultHasta(): string {
    const now = new Date();
    return this.formatDate(new Date(now.getFullYear(), now.getMonth(), 0));
  }

  private formatDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private categoryLabel(cat: string): string {
    switch (cat) {
      case 'OPERATIVO': return 'Operativo';
      case 'ESTRUCTURAL': return 'Estructural';
      case 'MANTENIMIENTO': return 'Mantenimiento';
      default: return cat;
    }
  }
}
