import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MessageModule } from 'primeng/message';
import { AdminGestionCohorteFacade } from '../../facades/admin-gestion-cohorte.facade';

@Component({
  selector: 'app-gestion-cohorte-postventa-panel',
  imports: [DecimalPipe, MessageModule],
  templateUrl: './gestion-cohorte-postventa-panel.component.html',
  styleUrl: './gestion-cohorte-postventa-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GestionCohortePostventaPanelComponent implements OnInit {
  protected readonly facade = inject(AdminGestionCohorteFacade);

  ngOnInit(): void {
    this.facade.start();
  }
}
