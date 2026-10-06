import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PaginatorModule } from 'primeng/paginator';
import { PopoverModule } from 'primeng/popover';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MetricsPeriodo, PeriodSelectorComponent } from '../../../../shared/components/period-selector/period-selector.component';
import { TreeSelectComponent, TreeSelectSelection } from '../../../../shared/components/tree-select/tree-select.component';
import { MetricsRango } from '../../../../shared/utils/metrics-period';
import { providerLogo as resolveProviderLogo } from '../../../../shared/utils/provider-logo';
import { PostventaGestionDrawerComponent } from '../../components/postventa-gestion-drawer/postventa-gestion-drawer.component';
import { PostventaWorkspaceFacade } from '../../facades/postventa-workspace.facade';
import { VisualLeadPostventa, semColor, semAbrev, semLabel, shortName } from '../../models/postventa.vm';

@Component({
  selector: 'app-postventa-workspace-page',
  imports: [
    FormsModule,
    ButtonModule,
    ConfirmDialogModule,
    PaginatorModule,
    PopoverModule,
    SelectModule,
    TableModule,
    TagModule,
    ToastModule,
    TooltipModule,
    PeriodSelectorComponent,
    TreeSelectComponent,
    PostventaGestionDrawerComponent
  ],
  providers: [PostventaWorkspaceFacade, MessageService, ConfirmationService],
  templateUrl: './postventa-workspace-page.component.html',
  styleUrl: './postventa-workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostventaWorkspacePageComponent implements OnInit {
  protected readonly facade = inject(PostventaWorkspaceFacade);

  protected readonly semColor = semColor;
  protected readonly semAbrev = semAbrev;
  protected readonly semLabel = semLabel;
  protected readonly shortName = shortName;
  protected readonly providerLogo = resolveProviderLogo;

  ngOnInit(): void {
    void this.facade.loadCortes();
    void this.facade.loadBoard();
    this.facade.startRealtime();
  }

  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.facade.onSearchInput(value);
  }

  protected async onSearchKeydown(event: KeyboardEvent): Promise<void> {
    if (event.key === 'Enter') {
      event.preventDefault();
      await this.facade.buscar();
    }
  }

  protected async onPeriodoChange(periodo: MetricsPeriodo): Promise<void> {
    await this.facade.onPeriodoChange(periodo);
  }

  protected async onRangoChange(rango: MetricsRango): Promise<void> {
    await this.facade.onRangoChange(rango);
  }

  protected async onSemaforoSelectionChange(selection: TreeSelectSelection): Promise<void> {
    await this.facade.onSemaforoSelectionChange(selection);
  }

  protected async onRowClick(row: VisualLeadPostventa): Promise<void> {
    await this.facade.gestionar(row);
  }

  protected formatDate(date?: string | null): string {
    if (!date) return '—';
    const d = date.slice(0, 10).split('-');
    if (d.length < 3) return date;
    return `${d[2]}/${d[1]}/${d[0].slice(2)}`;
  }

  protected formatCorte(row: VisualLeadPostventa): string {
    if (!row.mesCorteBase) return '—';
    const parts = row.mesCorteBase.slice(0, 7).split('-');
    const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const m = Number(parts[1]) - 1;
    const monthLabel = monthNames[m] ?? parts[1];
    return `${monthLabel} ${row.numeroCorteBase ?? ''} · R${row.numeroPeriodoVigente ?? '?'}`;
  }

  protected formatMonto(value?: number | null): string {
    if (value == null) return '—';
    return `S/ ${value.toFixed(2)}`;
  }

  protected countAdicionales(adicionales?: string | null): number {
    if (!adicionales) return 0;
    return adicionales.split(',').length;
  }

  protected formatGestionDate(date?: string | null): string {
    if (!date) return 'Sin gestión';
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(2);
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
    const h12 = d.getHours() % 12 || 12;
    return `${dd}/${mm}/${yy} ${h12}:${min}${ampm}`;
  }
}
