import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { AsesorBoardComponent } from '../../components/asesor-board/asesor-board.component';
import { LeadManagementDialogComponent } from '../../components/lead-management-dialog/lead-management-dialog.component';
import { AsesorVentasWorkspaceFacade } from '../../facades/asesor-ventas-workspace.facade';

@Component({
  selector: 'app-asesor-ventas-workspace-page',
  imports: [ButtonModule, CardModule, MessageModule, TagModule, AsesorBoardComponent, LeadManagementDialogComponent],
  providers: [AsesorVentasWorkspaceFacade],
  templateUrl: './asesor-ventas-workspace-page.component.html',
  styleUrl: './asesor-ventas-workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AsesorVentasWorkspacePageComponent implements OnInit, OnDestroy {
  protected readonly facade = inject(AsesorVentasWorkspaceFacade);

  ngOnInit(): void {
    this.facade.start();
  }

  ngOnDestroy(): void {
    this.facade.stop();
  }
}
