import { UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { TagModule } from 'primeng/tag';
import { GtrWorkspaceFacade } from '../../facades/gtr-workspace.facade';

@Component({
  selector: 'app-gtr-advisors-drawer',
  imports: [UpperCasePipe, ButtonModule, DrawerModule, TagModule],
  templateUrl: './gtr-advisors-drawer.component.html',
  styleUrl: './gtr-advisors-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrAdvisorsDrawerComponent {
  protected readonly facade = inject(GtrWorkspaceFacade);
}
