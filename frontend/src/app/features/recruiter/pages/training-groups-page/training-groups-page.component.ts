import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
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

  ngOnInit(): void {
    this.facade.initialize();
  }
}
