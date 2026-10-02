import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { PreventaInstalacionFacade } from '../../facades/preventa-instalacion.facade';
import { EstadoCumplimientoSemana } from '../../services/preventa-instalacion.service';

@Component({
  selector: 'app-preventa-instalacion-panel',
  imports: [CommonModule, FormsModule, CardModule, DialogModule, MessageModule],
  providers: [PreventaInstalacionFacade],
  templateUrl: './preventa-instalacion-panel.component.html',
  styleUrl: './preventa-instalacion-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreventaInstalacionPanelComponent implements OnInit {
  protected readonly facade = inject(PreventaInstalacionFacade);

  protected readonly estadoOptions: Array<{ label: string; value: string }> = [
    { label: 'Todos los estados', value: '' },
    { label: 'Activo', value: 'ACTIVO' },
    { label: 'Baja', value: 'BAJA' },
    { label: 'Suspendido', value: 'SUSPENDIDO' },
    { label: 'Sin estado', value: 'SIN_ESTADO' }
  ];

  protected readonly cumplimientoOptions: Array<{ label: string; value: string }> = [
    { label: 'Todos', value: '' },
    { label: 'Misma semana', value: 'true' },
    { label: 'Semana diferente', value: 'false' },
    { label: 'Pendiente de instalación', value: 'PENDIENTE_INSTALACION' },
    { label: 'No evaluable', value: 'NO_EVALUABLE' }
  ];

  ngOnInit(): void {
    this.facade.cargar();
  }

  protected onEstadoChange(value: string): void {
    this.facade.sinEstadoPostventa.set(value === 'SIN_ESTADO');
    this.facade.estadoPostventa.set(value === 'SIN_ESTADO' ? null : (value || null));
  }

  protected onCumplimientoChange(value: string): void {
    if (value === 'true') {
      this.facade.cumpleMismaSemana.set(true);
      this.facade.estadoCumplimientoSemana.set(null);
    } else if (value === 'false') {
      this.facade.cumpleMismaSemana.set(false);
      this.facade.estadoCumplimientoSemana.set(null);
    } else if (value === 'PENDIENTE_INSTALACION' || value === 'NO_EVALUABLE') {
      this.facade.cumpleMismaSemana.set(null);
      this.facade.estadoCumplimientoSemana.set(value);
    } else {
      this.facade.cumpleMismaSemana.set(null);
      this.facade.estadoCumplimientoSemana.set(null);
    }
  }

  protected estadoLabel(estado: EstadoCumplimientoSemana): string {
    return this.facade.estadoLabel(estado);
  }

  protected estadoClass(estado: EstadoCumplimientoSemana): string {
    return estado.toLowerCase();
  }

  protected cumplimientoValue(): string {
    const estado = this.facade.estadoCumplimientoSemana();
    if (estado) return estado;
    const cumple = this.facade.cumpleMismaSemana();
    return cumple === null ? '' : `${cumple}`;
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
