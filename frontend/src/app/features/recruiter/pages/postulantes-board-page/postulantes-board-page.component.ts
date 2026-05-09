import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { PostulacionDetailPanelComponent } from '../../components/postulacion-detail-panel/postulacion-detail-panel.component';
import { PostulantesKanbanPanelComponent } from '../../components/postulantes-kanban-panel/postulantes-kanban-panel.component';
import { RecruiterPostulantesFacade } from '../../facades/recruiter-postulantes.facade';

@Component({
  selector: 'app-postulantes-board-page',
  imports: [PostulantesKanbanPanelComponent, PostulacionDetailPanelComponent],
  providers: [RecruiterPostulantesFacade],
  templateUrl: './postulantes-board-page.component.html',
  styleUrl: './postulantes-board-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostulantesBoardPageComponent implements OnInit {
  protected readonly facade = inject(RecruiterPostulantesFacade);

  ngOnInit(): void {
    this.facade.initialize();
  }
}
