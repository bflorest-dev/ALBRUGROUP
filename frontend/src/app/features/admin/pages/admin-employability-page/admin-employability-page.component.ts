import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { OfferListPanelComponent } from '../../components/offer-list-panel/offer-list-panel.component';
import { OfferRegistrationPanelComponent } from '../../components/offer-registration-panel/offer-registration-panel.component';
import { AdminEmployabilityFacade } from '../../facades/admin-employability.facade';

@Component({
  selector: 'app-admin-employability-page',
  imports: [ButtonModule, DialogModule, TagModule, OfferRegistrationPanelComponent, OfferListPanelComponent],
  providers: [AdminEmployabilityFacade],
  templateUrl: './admin-employability-page.component.html',
  styleUrl: './admin-employability-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminEmployabilityPageComponent implements OnInit, OnDestroy {
  protected readonly facade = inject(AdminEmployabilityFacade);

  ngOnInit(): void {
    this.facade.initialize();
  }

  ngOnDestroy(): void {
    this.facade.destroy();
  }
}
