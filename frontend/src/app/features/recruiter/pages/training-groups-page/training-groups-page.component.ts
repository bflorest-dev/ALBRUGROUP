import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RecruitmentRealtimeService } from '../../../../core/services/recruitment-realtime.service';
import { GrupoCapacitacionRealtimeEvent } from '../../../../shared/models/recruitment/grupo-capacitacion-realtime-event';
import { TrainingGroupFormPanelComponent } from '../../components/training-group-form-panel/training-group-form-panel.component';
import { TrainingGroupListPanelComponent } from '../../components/training-group-list-panel/training-group-list-panel.component';
import { RecruiterTrainingGroupsFacade } from '../../facades/recruiter-training-groups.facade';

@Component({
  selector: 'app-training-groups-page',
  imports: [TrainingGroupFormPanelComponent, TrainingGroupListPanelComponent],
  providers: [RecruiterTrainingGroupsFacade],
  templateUrl: './training-groups-page.component.html',
  styleUrl: './training-groups-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrainingGroupsPageComponent implements OnInit {
  protected readonly facade = inject(RecruiterTrainingGroupsFacade);
  private readonly realtime = inject(RecruitmentRealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.facade.initialize();
    this.realtime.watchTopic<GrupoCapacitacionRealtimeEvent>('/topic/grupos-capacitacion')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.facade.handleRealtime());
    this.realtime.watchTopic('/topic/postulaciones')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.facade.handleRealtime());
  }
}
