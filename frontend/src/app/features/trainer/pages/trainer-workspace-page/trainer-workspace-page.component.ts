import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { RecruitmentRealtimeService } from '../../../../core/services/recruitment-realtime.service';
import { TrainerWorkspaceFacade } from '../../facades/trainer-workspace.facade';

@Component({
  selector: 'app-trainer-workspace-page',
  imports: [ReactiveFormsModule],
  providers: [TrainerWorkspaceFacade],
  templateUrl: './trainer-workspace-page.component.html',
  styleUrl: './trainer-workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrainerWorkspacePageComponent implements OnInit {
  protected readonly facade = inject(TrainerWorkspaceFacade);
  private readonly realtime = inject(RecruitmentRealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    void this.facade.initialize();
    this.realtime.watchTopic('/topic/grupos-capacitacion')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.facade.refreshRealtime());
    this.realtime.watchTopic('/topic/postulaciones')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.facade.refreshRealtime());
  }

  protected toLabel(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  protected toDate(value: string | null | undefined): string {
    return value ? new Date(value).toLocaleString('es-PE') : '-';
  }
}
