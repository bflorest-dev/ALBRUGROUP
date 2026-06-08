import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { MisPreventaDetailDialogComponent } from '../../components/mis-preventa-detail-dialog/mis-preventa-detail-dialog.component';
import { MisPreventasBoardComponent } from '../../components/mis-preventas-board/mis-preventas-board.component';
import { AsesorVentasMisPreventasFacade } from '../../facades/asesor-ventas-mis-preventas.facade';

@Component({
  selector: 'app-asesor-ventas-mis-preventas-page',
  imports: [CardModule, MessageModule, MisPreventasBoardComponent, MisPreventaDetailDialogComponent],
  providers: [AsesorVentasMisPreventasFacade],
  templateUrl: './asesor-ventas-mis-preventas-page.component.html',
  styleUrl: './asesor-ventas-mis-preventas-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AsesorVentasMisPreventasPageComponent implements OnInit {
  protected readonly facade = inject(AsesorVentasMisPreventasFacade);

  ngOnInit(): void {
    void this.facade.load();
  }
}
