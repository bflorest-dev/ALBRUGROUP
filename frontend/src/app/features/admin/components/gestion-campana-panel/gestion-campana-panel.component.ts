import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DateFieldComponent } from '../../../../shared/components/date-field/date-field.component';
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
    DateFieldComponent
  ],
  providers: [AdminGestionCampanaFacade],
  templateUrl: './gestion-campana-panel.component.html',
  styleUrl: './gestion-campana-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GestionCampanaPanelComponent implements OnChanges, OnInit {
  @Input() selectedEquipoId: number | null = null;

  protected readonly facade = inject(AdminGestionCampanaFacade);
  protected readonly maxDate = this.localToday();

  ngOnChanges(changes: SimpleChanges): void {
    if ('selectedEquipoId' in changes) {
      this.facade.setSelectedEquipoId(this.selectedEquipoId);
    }
  }

  ngOnInit(): void {
    this.facade.setSelectedEquipoId(this.selectedEquipoId);
    this.facade.start();
  }

  private localToday(): string {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }
}
