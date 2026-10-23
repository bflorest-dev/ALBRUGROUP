import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { AsesorBoardComponent } from '../../components/asesor-board/asesor-board.component';
import { LeadManagementDialogComponent } from '../../components/lead-management-dialog/lead-management-dialog.component';
import { PreventaDrawerV2Component } from '../../components/preventa-drawer-v2/preventa-drawer-v2.component';
import { AsesorVentasWorkspaceFacade } from '../../facades/asesor-ventas-workspace.facade';

@Component({
  selector: 'app-asesor-ventas-workspace-page',
  imports: [ButtonModule, CardModule, MessageModule, TagModule, AsesorBoardComponent, LeadManagementDialogComponent, PreventaDrawerV2Component],
  providers: [AsesorVentasWorkspaceFacade],
  templateUrl: './asesor-ventas-workspace-page.component.html',
  styleUrl: './asesor-ventas-workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AsesorVentasWorkspacePageComponent implements OnInit, OnDestroy {
  protected readonly facade = inject(AsesorVentasWorkspaceFacade);
  private readonly document = inject(DOCUMENT);
  /** Reversión local inmediata: añade ?preventaDrawer=v1 a la URL para volver al drawer vigente. */
  protected readonly usePreventaDrawerV2 = new URLSearchParams(this.document.defaultView?.location.search ?? '').get('preventaDrawer') !== 'v1';

  ngOnInit(): void {
    this.facade.start();
  }

  ngOnDestroy(): void {
    this.facade.stop();
  }
}
