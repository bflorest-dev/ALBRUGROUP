import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { PostulanteFormPanelComponent } from '../../components/postulante-form-panel/postulante-form-panel.component';
import { PostulantesListPanelComponent } from '../../components/postulantes-list-panel/postulantes-list-panel.component';
import { RrhhPostulantesFacade } from '../../facades/rrhh-postulantes.facade';

@Component({
  selector: 'app-rrhh-postulantes-page',
  imports: [PostulanteFormPanelComponent, PostulantesListPanelComponent],
  providers: [RrhhPostulantesFacade],
  templateUrl: './rrhh-postulantes-page.component.html',
  styleUrl: './rrhh-postulantes-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RrhhPostulantesPageComponent implements OnInit {
  protected readonly facade = inject(RrhhPostulantesFacade);

  ngOnInit(): void {
    this.facade.initialize();
  }
}
