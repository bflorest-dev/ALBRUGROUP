import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';
import { PostventaWorkspaceFacade } from '../../facades/postventa-workspace.facade';
import { TipoEncuestaPostventa } from '../../services/postventa-lead.service';
import { EstadoBadge, display, estadoBadge } from '../../models/postventa.vm';

@Component({
  selector: 'app-postventa-encuesta-panel',
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    StarRatingComponent
  ],
  templateUrl: './postventa-encuesta-panel.component.html',
  styleUrl: './postventa-encuesta-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostventaEncuestaPanelComponent {
  protected readonly facade = inject(PostventaWorkspaceFacade);
  protected readonly calificacionCtrl = new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(1), Validators.max(10)] });

  private readonly autoTipoEncuesta = computed<TipoEncuestaPostventa>(() =>
    this.facade.encuestas().length === 0 ? 'SATISFACCION_ASESOR' : 'SATISFACCION_SERVICIO'
  );

  constructor() {
    this.facade.registerBeforeTipificarTask('encuesta', () => this.guardarPendienteAntesDeTipificar());
  }

  protected badge(value: unknown): EstadoBadge {
    return estadoBadge(value);
  }

  protected display(value: unknown): string {
    return display(value);
  }

  protected autoTipoLabel(): string {
    return this.autoTipoEncuesta() === 'SATISFACCION_ASESOR' ? 'Satisfaccion del asesor' : 'Satisfaccion del servicio';
  }

  protected medioLabel(): string | null {
    const medio = this.facade.medioContacto();
    if (medio === 'LLAMADA') return 'Llamada';
    if (medio === 'CHAT') return 'Chat';
    return null;
  }

  private async guardar(): Promise<boolean> {
    if (this.calificacionCtrl.invalid || !this.facade.medioContacto()) return false;
    const ok = await this.facade.registrarEncuesta({
      tipoEncuesta: this.autoTipoEncuesta(),
      calificacion: this.calificacionCtrl.value,
      comentario: null
    });
    if (ok) {
      this.calificacionCtrl.reset(0);
      this.calificacionCtrl.markAsPristine();
    }
    return ok;
  }

  private async guardarPendienteAntesDeTipificar(): Promise<boolean> {
    if (this.calificacionCtrl.value <= 0) return true;
    return this.guardar();
  }
}
