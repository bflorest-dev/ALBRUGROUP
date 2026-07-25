import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';
import { PostventaWorkspaceFacade } from '../../facades/postventa-workspace.facade';
import { TipoEncuestaPostventa } from '../../services/postventa-lead.service';
import { EstadoBadge, SelectOption, display, estadoBadge } from '../../models/postventa.vm';

/** Encuesta de satisfaccion del cliente y su historial. El medio de contacto se infiere del ultimo
 *  boton Llamar/Chat usado; sin contacto previo no se puede registrar la encuesta. */
@Component({
  selector: 'app-postventa-encuesta-panel',
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    ButtonModule,
    SelectModule,
    TableModule,
    TagModule,
    TextareaModule,
    StarRatingComponent
  ],
  templateUrl: './postventa-encuesta-panel.component.html',
  styleUrl: './postventa-encuesta-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostventaEncuestaPanelComponent {
  protected readonly facade = inject(PostventaWorkspaceFacade);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly tipoEncuestaOptions: SelectOption<TipoEncuestaPostventa>[] = [
    { label: 'Satisfaccion del servicio', value: 'SATISFACCION_SERVICIO' },
    { label: 'Satisfaccion con el asesor', value: 'SATISFACCION_ASESOR' }
  ];

  protected readonly form = this.fb.group({
    tipoEncuesta: ['SATISFACCION_SERVICIO' as TipoEncuestaPostventa],
    calificacion: [0, [Validators.required, Validators.min(1), Validators.max(10)]],
    comentario: ['']
  });

  protected badge(value: unknown): EstadoBadge {
    return estadoBadge(value);
  }

  protected display(value: unknown): string {
    return display(value);
  }

  /** Etiqueta legible del medio de contacto detectado (o null si aun no se ha contactado). */
  protected medioLabel(): string | null {
    const medio = this.facade.medioContacto();
    if (medio === 'LLAMADA') {
      return 'Llamada';
    }
    if (medio === 'CHAT') {
      return 'Chat';
    }
    return null;
  }

  protected async guardar(): Promise<void> {
    if (this.form.invalid || !this.facade.medioContacto()) {
      return;
    }
    const raw = this.form.getRawValue();
    const ok = await this.facade.registrarEncuesta({
      tipoEncuesta: raw.tipoEncuesta,
      calificacion: raw.calificacion,
      comentario: raw.comentario || null
    });
    if (ok) {
      this.form.reset({ tipoEncuesta: raw.tipoEncuesta, calificacion: 0, comentario: '' });
    }
  }
}
