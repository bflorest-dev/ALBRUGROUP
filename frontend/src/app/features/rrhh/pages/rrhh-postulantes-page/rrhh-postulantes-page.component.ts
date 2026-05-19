import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
    PhoneActionButtonComponent
  ],
  providers: [RrhhWorkspaceFacade],
  templateUrl: './rrhh-postulantes-page.component.html',
  styleUrl: './rrhh-postulantes-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RrhhPostulantesPageComponent implements OnInit {
  protected readonly facade = inject(RrhhWorkspaceFacade);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const section = (this.route.snapshot.data['section'] ?? 'asistencia') as RrhhSection;
    void this.facade.initialize(section);
  }

  protected toLabel(value: string | null | undefined): string {
    return formatLabel(value);
  }

  protected toDate(value: string | null | undefined): string {
    return value ? new Date(value).toLocaleString('es-PE') : '-';
  }
}
