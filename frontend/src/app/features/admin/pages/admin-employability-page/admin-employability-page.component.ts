import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RecruitmentRealtimeService } from '../../../../core/services/recruitment-realtime.service';
import { OfertaLaboralRealtimeEvent } from '../../../../shared/models/recruitment/oferta-laboral-realtime-event';
import { OfferListPanelComponent } from '../../components/offer-list-panel/offer-list-panel.component';
import { OfferRegistrationPanelComponent } from '../../components/offer-registration-panel/offer-registration-panel.component';
import { AdminEmployabilityFacade } from '../../facades/admin-employability.facade';

@Component({
  selector: 'app-admin-employability-page',
  imports: [OfferRegistrationPanelComponent, OfferListPanelComponent],
  providers: [AdminEmployabilityFacade],
  templateUrl: './admin-employability-page.component.html',
  styleUrl: './admin-employability-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminEmployabilityPageComponent implements OnInit, OnDestroy {
  protected readonly facade = inject(AdminEmployabilityFacade);
  private readonly realtime = inject(RecruitmentRealtimeService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly lastSync = signal(new Date());

  ngOnInit(): void {
    this.facade.initialize();
    this.realtime.watchTopic<OfertaLaboralRealtimeEvent>('/topic/ofertas-laborales')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.lastSync.set(new Date());
        this.facade.loadOffers(this.facade.currentPage(), true);
      });
  }

  ngOnDestroy(): void {
    this.facade.destroy();
  }

  protected refresh(): void {
    this.lastSync.set(new Date());
    this.facade.loadOffers();
  }

  protected countByEstado(estado: string): number {
    return this.facade.offers().filter((offer) => offer.estado === estado).length;
  }

  protected expansionCount(): number {
    return this.facade.offers().reduce((total, offer) => total + offer.ampliaciones.length, 0);
  }

  protected syncTime(): string {
    return this.lastSync().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }
}
