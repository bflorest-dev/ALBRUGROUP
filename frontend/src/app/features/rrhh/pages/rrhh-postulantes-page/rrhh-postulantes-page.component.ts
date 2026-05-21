import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DrawerModule } from 'primeng/drawer';
import { MessageModule } from 'primeng/message';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { PhoneActionButtonComponent } from '../../../../shared/components/phone-action-button/phone-action-button.component';
import { formatLabel } from '../../../../shared/utils/display-label';
import { RrhhContractPanelComponent } from '../../components/rrhh-contract-panel/rrhh-contract-panel.component';
import { RrhhEmployeePanelComponent } from '../../components/rrhh-employee-panel/rrhh-employee-panel.component';
import { RrhhEventsPanelComponent } from '../../components/rrhh-events-panel/rrhh-events-panel.component';
import { RrhhHiringPanelComponent } from '../../components/rrhh-hiring-panel/rrhh-hiring-panel.component';
import { RrhhOperationsPanelComponent } from '../../components/rrhh-operations-panel/rrhh-operations-panel.component';
import { RrhhSection, RrhhWorkspaceFacade } from '../../facades/rrhh-workspace.facade';

@Component({
  selector: 'app-rrhh-postulantes-page',
  imports: [
    RrhhHiringPanelComponent,
    RrhhEmployeePanelComponent,
    RrhhContractPanelComponent,
    RrhhEventsPanelComponent,
    RrhhOperationsPanelComponent,
    PhoneActionButtonComponent,
    ButtonModule,
    CardModule,
    DrawerModule,
    MessageModule,
    PaginatorModule,
    ProgressSpinnerModule,
    TableModule,
    TabsModule,
    TagModule
  ],
  providers: [RrhhWorkspaceFacade],
  templateUrl: './rrhh-postulantes-page.component.html',
  styleUrl: './rrhh-postulantes-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RrhhPostulantesPageComponent implements OnInit, OnDestroy {
  protected readonly facade = inject(RrhhWorkspaceFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const section = (this.route.snapshot.data['section'] ?? 'asistencia') as RrhhSection;
    void this.facade.initialize(section);
  }

  ngOnDestroy(): void {
    this.facade.destroy();
  }

  protected toLabel(value: string | null | undefined): string {
    return formatLabel(value);
  }

  protected toDate(value: string | null | undefined): string {
    return value ? new Date(value).toLocaleString('es-PE') : '-';
  }

  protected sectionSeverity(value: string | null | undefined): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (value) {
      case 'ONLINE':
      case 'DISPONIBLE':
      case 'ACTIVO':
      case 'INGRESO':
        return 'success';
      case 'ALMUERZO':
      case 'SERVICIOS':
      case 'CAPACITACION':
      case 'GESTIONANDO':
      case 'ESPERADO':
        return 'warn';
      case 'OFFLINE':
      case 'INACTIVO':
        return 'danger';
      default:
        return 'info';
    }
  }

  protected async changeSection(value: string | number | undefined): Promise<void> {
    if (!value) {
      return;
    }

    const section = String(value) as RrhhSection;
    await this.router.navigate(['/app/rrhh', section]);
    await this.facade.initialize(section);
  }
}
