import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PreventaInstalacionPanelComponent } from '../../components/preventa-instalacion-panel/preventa-instalacion-panel.component';

@Component({
  selector: 'app-revision-semanal-page',
  imports: [PreventaInstalacionPanelComponent],
  templateUrl: './revision-semanal-page.component.html',
  styleUrl: './revision-semanal-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RevisionSemanalPageComponent {}
