import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { LeadCommercialDataTabsComponent } from '../../../../shared/components/lead-commercial-data-tabs/lead-commercial-data-tabs.component';
import { AsesorVentasMisPreventasFacade } from '../../facades/asesor-ventas-mis-preventas.facade';

@Component({
  selector: 'app-mis-preventa-detail-dialog',
  imports: [ButtonModule, DialogModule, SkeletonModule, TagModule, LeadCommercialDataTabsComponent],
  templateUrl: './mis-preventa-detail-dialog.component.html',
  styleUrl: './mis-preventa-detail-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MisPreventaDetailDialogComponent {
  protected readonly facade = inject(AsesorVentasMisPreventasFacade);
}
