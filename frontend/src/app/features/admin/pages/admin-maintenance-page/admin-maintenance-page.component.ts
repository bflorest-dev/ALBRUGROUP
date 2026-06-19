import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import {
  CATALOG_MAINTENANCE_SECTIONS,
  CatalogMaintenancePanelComponent
} from '../../../community/components/catalog-maintenance-panel/catalog-maintenance-panel.component';
import { CommunitySection, CommunityWorkspaceFacade } from '../../../community/facades/community-workspace.facade';

@Component({
  selector: 'app-admin-maintenance-page',
  imports: [ButtonModule, CardModule, TagModule, CatalogMaintenancePanelComponent],
  providers: [CommunityWorkspaceFacade],
  templateUrl: './admin-maintenance-page.component.html',
  styleUrl: './admin-maintenance-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminMaintenancePageComponent implements OnInit {
  protected readonly facade = inject(CommunityWorkspaceFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sections = CATALOG_MAINTENANCE_SECTIONS;

  constructor() {
    const savedTab = this.route.snapshot.queryParams['tab'] as CommunitySection | undefined;
    if (savedTab && this.sections.some((section) => section.id === savedTab)) {
      this.facade.setSection(savedTab);
    }

    effect(() => {
      const section = this.facade.section();
      const urlTree = this.router.createUrlTree([], {
        relativeTo: this.route,
        queryParams: { tab: section },
        queryParamsHandling: 'merge'
      });
      this.location.replaceState(this.router.serializeUrl(urlTree));
    });
  }

  ngOnInit(): void {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.facade.setAccessMode('admin');
      void this.facade.initialize('mantenimiento');
    });
  }
}
