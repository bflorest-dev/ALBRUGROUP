import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RrhhContractPanelComponent } from '../../components/rrhh-contract-panel/rrhh-contract-panel.component';
import { RrhhEmployeePanelComponent } from '../../components/rrhh-employee-panel/rrhh-employee-panel.component';
import { RrhhEventsPanelComponent } from '../../components/rrhh-events-panel/rrhh-events-panel.component';
import { RrhhHiringPanelComponent } from '../../components/rrhh-hiring-panel/rrhh-hiring-panel.component';
import { RrhhOperationsPanelComponent } from '../../components/rrhh-operations-panel/rrhh-operations-panel.component';
import { RrhhWorkspaceFacade } from '../../facades/rrhh-workspace.facade';

@Component({
  selector: 'app-rrhh-postulantes-page',
  imports: [
    RrhhHiringPanelComponent,
    RrhhEmployeePanelComponent,
    RrhhContractPanelComponent,
    RrhhEventsPanelComponent,
    RrhhOperationsPanelComponent
  ],
  providers: [RrhhWorkspaceFacade],
  templateUrl: './rrhh-postulantes-page.component.html',
  styleUrl: './rrhh-postulantes-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RrhhPostulantesPageComponent implements OnInit {
  protected readonly facade = inject(RrhhWorkspaceFacade);

  ngOnInit(): void {
    void this.facade.initialize();
  }
}
