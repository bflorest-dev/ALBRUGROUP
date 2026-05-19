import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { EventoResponse } from '../../../../shared/models/recruitment/evento-response';
import { OfertaLaboralResponse } from '../../../../shared/models/recruitment/oferta-laboral-response';
import { PostulacionResponse } from '../../../../shared/models/recruitment/postulacion-response';
import { formatLabel } from '../../../../shared/utils/display-label';
import { PostulanteFormPanelComponent } from '../postulante-form-panel/postulante-form-panel.component';
import { PostulantesListPanelComponent } from '../postulantes-list-panel/postulantes-list-panel.component';

@Component({
  selector: 'app-rrhh-hiring-panel',
  imports: [PostulanteFormPanelComponent, PostulantesListPanelComponent],
  templateUrl: './rrhh-hiring-panel.component.html',
  styleUrl: './rrhh-hiring-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RrhhHiringPanelComponent {
  @Input() mode: 'empleabilidad' | 'contrataciones' = 'empleabilidad';
  @Input({ required: true }) postulanteForm!: FormGroup;
  @Input({ required: true }) filterForm!: FormGroup;
  @Input({ required: true }) activeOffers: OfertaLaboralResponse[] = [];
  @Input({ required: true }) documentoOptions: string[] = [];
  @Input({ required: true }) origenOptions: string[] = [];
  @Input({ required: true }) etapaOptions: string[] = [];
  @Input({ required: true }) estadoOptions: string[] = [];
  @Input({ required: true }) estadoBandejaOptions: string[] = [];
  @Input({ required: true }) postulaciones: PostulacionResponse[] = [];
  @Input({ required: true }) currentPage = 0;
  @Input({ required: true }) totalPages = 1;
  @Input({ required: true }) isLoadingPostulaciones = false;
  @Input({ required: true }) isLoadingActiveOffers = false;
  @Input({ required: true }) isSaving = false;
  @Input({ required: true }) isEditing = false;
  @Input({ required: true }) listErrorMessage = '';
  @Input({ required: true }) activeOffersErrorMessage = '';
  @Input({ required: true }) saveErrorMessage = '';
  @Input({ required: true }) saveSuccessMessage = '';
  @Input({ required: true }) readyCases: PostulacionResponse[] = [];
  @Input({ required: true }) currentReadyPage = 0;
  @Input({ required: true }) totalReadyPages = 1;
  @Input({ required: true }) isLoadingReadyCases = false;
  @Input({ required: true }) readyCasesErrorMessage = '';
  @Input({ required: true }) selectedHiringCase: PostulacionResponse | null = null;
  @Input({ required: true }) hiringEvents: EventoResponse[] = [];
  @Input({ required: true }) isLoadingHiringEvents = false;
  @Input({ required: true }) hiringEventsErrorMessage = '';

  @Output() readonly save = new EventEmitter<void>();
  @Output() readonly cancelEdit = new EventEmitter<void>();
  @Output() readonly applyFilters = new EventEmitter<void>();
  @Output() readonly clearFilters = new EventEmitter<void>();
  @Output() readonly reload = new EventEmitter<void>();
  @Output() readonly pageChange = new EventEmitter<number>();
  @Output() readonly edit = new EventEmitter<PostulacionResponse>();
  @Output() readonly reloadReadyCases = new EventEmitter<void>();
  @Output() readonly readyCasePageChange = new EventEmitter<number>();
  @Output() readonly selectHiringCase = new EventEmitter<PostulacionResponse>();
  @Output() readonly openEmployeeRegistration = new EventEmitter<void>();

  protected toLabel(value: string | null | undefined): string {
    return formatLabel(value);
  }

  protected toDate(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    return new Date(value).toLocaleString('es-PE');
  }
}
