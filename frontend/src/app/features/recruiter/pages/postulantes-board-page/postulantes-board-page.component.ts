import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RecruitmentRealtimeService } from '../../../../core/services/recruitment-realtime.service';
import { GrupoCapacitacionRealtimeEvent } from '../../../../shared/models/recruitment/grupo-capacitacion-realtime-event';
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
  private readonly realtime = inject(RecruitmentRealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.facade.initialize();
    this.realtime.watchTopic('/topic/postulaciones')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.facade.handleRealtime());
    this.realtime.watchTopic<GrupoCapacitacionRealtimeEvent>('/topic/grupos-capacitacion')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.facade.refreshTrainingGroups());
  }
}
