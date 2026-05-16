import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
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

  ngOnInit(): void {
    void this.facade.initialize();
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
