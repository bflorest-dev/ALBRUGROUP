import { SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { AdminBaseLeadsFacade } from '../../facades/admin-base-leads.facade';

@Component({
  selector: 'app-admin-base-leads-page',
  imports: [SlicePipe, FormsModule, DatePickerModule, MultiSelectModule, ConfirmDialogModule],
  providers: [ConfirmationService],
  templateUrl: './admin-base-leads-page.component.html',
  styleUrl: './admin-base-leads-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminBaseLeadsPageComponent implements OnInit {
  readonly facade = inject(AdminBaseLeadsFacade);
  private readonly confirmationService = inject(ConfirmationService);
  protected readonly Math = Math;

  ngOnInit(): void {
    this.facade.init();
  }

  onEtapaChange(): void {
    this.facade.codigosTipificacion.set([]);
    this.facade.codigosSubtipificacion.set([]);
    this.facade.tipificaciones.set([]);
    if (this.facade.idProveedor() != null) {
      this.facade.loadTipificaciones();
    }
  }

  onProveedorChange(): void {
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
}
