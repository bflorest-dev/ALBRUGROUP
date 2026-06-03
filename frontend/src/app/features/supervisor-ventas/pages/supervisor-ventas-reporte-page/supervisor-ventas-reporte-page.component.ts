import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { DateFieldComponent } from '../../../../shared/components/date-field/date-field.component';
import { SupervisorVentasReporteFacade } from '../../facades/supervisor-ventas-reporte.facade';

@Component({
  selector: 'app-supervisor-ventas-reporte-page',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    CardModule,
    DateFieldComponent,
    MessageModule,
    SelectModule,
    TableModule
  ],
  providers: [SupervisorVentasReporteFacade],
  templateUrl: './supervisor-ventas-reporte-page.component.html',
  styleUrl: './supervisor-ventas-reporte-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupervisorVentasReportePageComponent {
  protected readonly facade = inject(SupervisorVentasReporteFacade);
  protected readonly periodOptions = [
    { label: 'Mes actual', value: 'current-month' },
    { label: 'Mes anterior', value: 'previous-month' },
    { label: 'Personalizado', value: 'custom' }
  ];

  protected readonly reportTitle = computed(() => {
    const preset = this.facade.preset();
    if (preset === 'previous-month') {
      return 'Reporte de ventas del mes anterior';
    }
    if (preset === 'custom') {
      return 'Reporte de ventas por rango';
    }
    return 'Reporte de ventas del mes actual';
  });

  protected onPresetChange(value: 'current-month' | 'previous-month' | 'custom' | null | undefined): void {
    if (!value) {
      return;
    }

    this.facade.setPreset(value);
  }
}
