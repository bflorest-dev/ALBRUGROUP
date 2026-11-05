import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MessageModule } from 'primeng/message';
import { SupervisorGtrCampaignAssignmentComponent } from '../../components/supervisor-gtr-campaign-assignment/supervisor-gtr-campaign-assignment.component';
import { SupervisorGtrCampaignsFacade } from '../../facades/supervisor-gtr-campaigns.facade';
import { DistribucionCampanasProveedorRequest } from '../../../../shared/models/preventa/preventa.models';

@Component({
  selector: 'app-supervisor-gtr-campaigns-page',
  imports: [MessageModule, SupervisorGtrCampaignAssignmentComponent],
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

  protected onProveedorChange(idProveedor: number | null): void {
    this.facade.seleccionarProveedor(idProveedor);
  }

  protected onSave(request: DistribucionCampanasProveedorRequest): void {
    void this.facade.guardarDistribucion(request);
  }
}
