import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { SelectButtonModule } from 'primeng/selectbutton';
import { PeriodSelectorComponent } from '../../../../shared/components/period-selector/period-selector.component';
import { PreventaInstalacionFacade } from '../../facades/preventa-instalacion.facade';

@Component({
  selector: 'app-preventa-instalacion-panel',
  imports: [CommonModule, FormsModule, CardModule, DialogModule, MessageModule, SelectButtonModule, PeriodSelectorComponent],
  providers: [PreventaInstalacionFacade],
  templateUrl: './preventa-instalacion-panel.component.html',
  styleUrl: './preventa-instalacion-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreventaInstalacionPanelComponent implements OnInit {
  protected readonly facade = inject(PreventaInstalacionFacade);

  ngOnInit(): void {
    this.facade.cargar();
  }

  protected onPeriodoChange(value: 'dia' | 'semana' | 'mes'): void {
    this.facade.periodo.set(value);
  }

  protected onProveedorChange(value: number | null): void {
    this.facade.seleccionarProveedor(value);
  }

  protected onAsesorChange(value: string): void {
    this.facade.seleccionarAsesor(value ? Number(value) : null);
  }

  protected fecha(value: string | null): string {
    if (!value) return '—';
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }

  protected texto(value: string | null): string {
    return value?.trim() || '—';
  }
}
