import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MessageModule } from 'primeng/message';
import { SupervisorGtrCampaignAssignmentComponent } from '../../components/supervisor-gtr-campaign-assignment/supervisor-gtr-campaign-assignment.component';
import { SupervisorGtrProviderMetricsComponent } from '../../components/supervisor-gtr-provider-metrics/supervisor-gtr-provider-metrics.component';
import { SupervisorGtrCampaignsFacade } from '../../facades/supervisor-gtr-campaigns.facade';

@Component({
  selector: 'app-supervisor-gtr-campaigns-page',
  imports: [
    MessageModule,
    SupervisorGtrCampaignAssignmentComponent,
    SupervisorGtrProviderMetricsComponent
  ],
  providers: [SupervisorGtrCampaignsFacade],
  templateUrl: './supervisor-gtr-campaigns-page.component.html',
  styleUrl: './supervisor-gtr-campaigns-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupervisorGtrCampaignsPageComponent implements OnInit {
  protected readonly facade = inject(SupervisorGtrCampaignsFacade);

  ngOnInit(): void {
    void this.facade.inicializar();
  }

  protected onEquipoChange(idEquipo: number | null): void {
    void this.facade.seleccionarEquipo(idEquipo);
  }

  protected onSave(campanaIds: number[]): void {
    void this.facade.guardarCampanas(campanaIds);
  }
}
