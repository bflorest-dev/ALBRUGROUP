import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, effect, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { CampaignFinanceDashboardPanelComponent } from '../../../../shared/components/campaign-finance-dashboard-panel/campaign-finance-dashboard-panel.component';
import {
  CATALOG_MAINTENANCE_SECTIONS,
  CatalogMaintenancePanelComponent
} from '../../components/catalog-maintenance-panel/catalog-maintenance-panel.component';
import { CommunityPageMode, CommunitySection, CommunityWorkspaceFacade } from '../../facades/community-workspace.facade';

@Component({
  selector: 'app-community-workspace-page',
  imports: [
    ButtonModule,
    CardModule,
    MessageModule,
    TagModule,
    CampaignFinanceDashboardPanelComponent,
    CatalogMaintenancePanelComponent
  ],
  providers: [CommunityWorkspaceFacade],
  templateUrl: './community-workspace-page.component.html',
  styleUrl: './community-workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommunityWorkspacePageComponent implements OnInit {
  protected readonly facade = inject(CommunityWorkspaceFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly pageMode = signal<CommunityPageMode>('mantenimiento');
  protected readonly sections = CATALOG_MAINTENANCE_SECTIONS;

  constructor() {
    // Restaurar la tab activa desde la URL al recargar (lectura sincrónica antes del primer effect)
    const savedTab = this.route.snapshot.queryParams['tab'] as CommunitySection | undefined;
    if (savedTab && this.sections.some((s) => s.id === savedTab)) {
      this.facade.setSection(savedTab);
    }

    // Mantener la URL sincronizada cuando el usuario cambia de tab (sin disparar navegación)
    effect(() => {
      const section = this.facade.section();
      if (this.pageMode() !== 'mantenimiento') return;
      const urlTree = this.router.createUrlTree([], {
        relativeTo: this.route,
        queryParams: { tab: section },
        queryParamsHandling: 'merge'
      });
      this.location.replaceState(this.router.serializeUrl(urlTree));
    });

    effect(() => {
      const mode = this.pageMode();
      if (!this.facade.canDisplayOperationalData()) {
        return;
      }
      if (mode === 'mantenimiento' && !this.facade.proveedores().length && !this.facade.isLoading()) {
        void this.facade.loadAll();
      }
    });
  }

  ngOnInit(): void {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      const mode: CommunityPageMode =
        data['section'] === 'finanzas' ? 'finanzas' : data['section'] === 'metricas' ? 'metricas' : 'mantenimiento';
      this.pageMode.set(mode);
      this.facade.setAccessMode('community');
      void this.facade.initialize(mode);
    });
  }

  protected display(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    return String(value);
  }
}
