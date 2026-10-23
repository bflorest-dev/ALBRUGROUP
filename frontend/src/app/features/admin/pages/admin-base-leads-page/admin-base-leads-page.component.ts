import { SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { PeriodSelectorComponent } from '../../../../shared/components/period-selector/period-selector.component';
import { AdminBaseLeadsFacade } from '../../facades/admin-base-leads.facade';

@Component({
  selector: 'app-admin-base-leads-page',
  imports: [SlicePipe, FormsModule, SelectModule, DatePickerModule, MultiSelectModule, ConfirmDialogModule, PeriodSelectorComponent],
  providers: [ConfirmationService],
  templateUrl: './admin-base-leads-page.component.html',
  styleUrl: './admin-base-leads-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminBaseLeadsPageComponent implements OnInit {
  readonly facade = inject(AdminBaseLeadsFacade);
  private readonly confirmationService = inject(ConfirmationService);
  protected readonly Math = Math;
  protected readonly modoExportOptions = [
    { label: 'Encriptado (.alb)', value: 'ALB' },
    { label: 'Excel (.xlsx)', value: 'EXCEL' }
  ];
  private readonly corteMonthFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    timeZone: 'UTC'
  });

  ngOnInit(): void {
    this.facade.init();
  }

  onEtapaChange(): void {
    this.facade.codigosTipificacion.set([]);
    this.facade.codigosSubtipificacion.set([]);
    this.facade.tipificaciones.set([]);
    if (this.facade.idProveedor() != null || this.facade.idProveedorOrigen() != null) {
      this.facade.loadTipificaciones();
    }
  }

  onProveedorChange(): void {
    if (this.facade.isInstalados()) {
      return;
    }
    this.resetAndLoadTipificaciones();
  }

  onProveedorOrigenChange(): void {
    this.resetAndLoadTipificaciones();
  }

  private resetAndLoadTipificaciones(): void {
    this.facade.codigosTipificacion.set([]);
    this.facade.codigosSubtipificacion.set([]);
    this.facade.loadTipificaciones();
  }

  onPageChange(event: { first: number; rows: number }): void {
    const newPage = Math.floor(event.first / event.rows);
    this.facade.pageSize.set(event.rows);
    this.facade.changePage(newPage);
  }

  confirmarExport(): void {
    const total = this.facade.totalForExport();
    const archivos = this.facade.archivosEstimados();
    this.confirmationService.confirm({
      header: 'Confirmar exportacion',
      message: `Se exportaran ${total.toLocaleString()} leads en ${archivos} archivo${archivos > 1 ? 's' : ''} .alb. ¿Continuar?`,
      acceptLabel: 'Exportar',
      rejectLabel: 'Cancelar',
      accept: () => this.facade.exportar()
    });
  }

  protected fechaColumna(): string {
    if (this.facade.isInstalados()) {
      return 'Instalación';
    }
    return this.facade.anclaFecha() === 'INGRESO_ETAPA' ? 'Ingreso a etapa' : 'Fecha tipificación';
  }

  protected fechaFila(row: { fechaIngresoEtapa: string | null; fechaTipificacion: string | null; fechaInstalacion: string | null }): string | null {
    if (this.facade.isInstalados()) {
      return row.fechaInstalacion;
    }
    return this.facade.anclaFecha() === 'INGRESO_ETAPA' ? row.fechaIngresoEtapa : row.fechaTipificacion;
  }

  protected coordenadas(row: { latitud: string | null; longitud: string | null }): string {
    const lat = row.latitud?.trim();
    const lon = row.longitud?.trim();
    if (lat && lon) return `${lat}, ${lon}`;
    return lat || lon || '—';
  }

  protected corteFila(row: { mesCorteBase: string | null; numeroCorteBase: number | null }): string {
    if (!row.mesCorteBase || row.numeroCorteBase == null) {
      return '—';
    }
    const mes = new Date(`${row.mesCorteBase.slice(0, 10)}T00:00:00Z`);
    if (Number.isNaN(mes.getTime())) {
      return '—';
    }
    return `${this.corteMonthFormatter.format(mes).toUpperCase()} ${row.numeroCorteBase}`;
  }

  protected estadoFila(row: { estadoClientePostventa: string | null }): string {
    switch (row.estadoClientePostventa) {
      case 'SUSPENDIDO':
        return 'Suspendido';
      case 'BAJA':
        return 'Baja';
      default:
        return 'Activo';
    }
  }

  protected estadoClase(row: { estadoClientePostventa: string | null }): string {
    return (row.estadoClientePostventa ?? 'ACTIVO').toLowerCase();
  }
}
