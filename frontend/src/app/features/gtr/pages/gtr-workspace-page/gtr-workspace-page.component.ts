import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { GtrWorkspaceFacade } from '../../facades/gtr-workspace.facade';

@Component({
  selector: 'app-gtr-workspace-page',
  imports: [ReactiveFormsModule, DatePipe],
  providers: [GtrWorkspaceFacade],
  templateUrl: './gtr-workspace-page.component.html',
  styleUrl: './gtr-workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrWorkspacePageComponent implements OnInit, OnDestroy {
  protected readonly facade = inject(GtrWorkspaceFacade);

  ngOnInit(): void {
    this.facade.start();
  }

  ngOnDestroy(): void {
    this.facade.stop();
  }
}
