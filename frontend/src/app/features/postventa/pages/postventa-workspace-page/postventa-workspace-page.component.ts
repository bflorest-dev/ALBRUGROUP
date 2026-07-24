import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { PostventaBoardComponent } from '../../components/postventa-board/postventa-board.component';
import { PostventaGestionDrawerComponent } from '../../components/postventa-gestion-drawer/postventa-gestion-drawer.component';
import { PostventaWorkspaceFacade } from '../../facades/postventa-workspace.facade';

/** Pagina de POSTVENTA: orquestador delgado. Provee el facade compartido y compone el encabezado,
 *  la bandeja y el drawer de gestion. Sin logica de negocio ni HTTP (todo vive en el facade). */
@Component({
  selector: 'app-postventa-workspace-page',
  imports: [
    ButtonModule,
    ConfirmDialogModule,
    TagModule,
    ToastModule,
    PageHeaderComponent,
    PostventaBoardComponent,
    PostventaGestionDrawerComponent
  ],
  providers: [PostventaWorkspaceFacade, MessageService, ConfirmationService],
  templateUrl: './postventa-workspace-page.component.html',
  styleUrl: './postventa-workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostventaWorkspacePageComponent implements OnInit {
  protected readonly facade = inject(PostventaWorkspaceFacade);

  ngOnInit(): void {
    void this.facade.loadBoard();
  }
}
