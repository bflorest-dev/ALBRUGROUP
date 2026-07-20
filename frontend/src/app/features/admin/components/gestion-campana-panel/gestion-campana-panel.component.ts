import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PeriodSelectorComponent } from '../../../../shared/components/period-selector/period-selector.component';
import { SectionHeaderComponent } from '../../../../shared/components/section-header/section-header.component';
import { AdminGestionCampanaFacade } from '../../facades/admin-gestion-campana.facade';

/**
 * Panel "Gestión por campaña" del DASHBOARD del ADMIN. Matriz tipificación × campaña, una por equipo,
 * con toggle de campo (primera/última/mayor) y período (hoy/mes/personalizado). Provee su propio
 * facade (bloque autónomo del dashboard).
 */
@Component({
  selector: 'app-gestion-campana-panel',
  imports: [
    DecimalPipe,
    FormsModule,
    ButtonModule,
    CardModule,
    MessageModule,
    MultiSelectModule,
    SelectButtonModule,
    TableModule,
    TagModule,
    TooltipModule,
    PeriodSelectorComponent,
    SectionHeaderComponent
  ],
  providers: [AdminGestionCampanaFacade],
  templateUrl: './gestion-campana-panel.component.html',
  styleUrl: './gestion-campana-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GestionCampanaPanelComponent implements OnInit {
  protected readonly facade = inject(AdminGestionCampanaFacade);

  ngOnInit(): void {
    this.facade.start();
  }
}
