import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import {
  BandejaColumn,
  BandejaColumnKey
} from '../../facades/recruiter-postulantes.facade';
import { PageResponse } from '../../../../shared/models/common/page-response';
import { PostulacionResponse } from '../../../../shared/models/recruitment/postulacion-response';

@Component({
  selector: 'app-postulantes-kanban-panel',
  templateUrl: './postulantes-kanban-panel.component.html',
  styleUrl: './postulantes-kanban-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostulantesKanbanPanelComponent {
  @Input({ required: true }) columns: BandejaColumn[] = [];
  @Input({ required: true }) pages: Record<BandejaColumnKey, PageResponse<PostulacionResponse>> =
    {} as Record<BandejaColumnKey, PageResponse<PostulacionResponse>>;
  @Input({ required: true }) loadingByColumn: Record<BandejaColumnKey, boolean> =
    {} as Record<BandejaColumnKey, boolean>;
  @Input({ required: true }) errorByColumn: Record<BandejaColumnKey, string> =
    {} as Record<BandejaColumnKey, string>;

  @Output() readonly reloadColumn = new EventEmitter<BandejaColumnKey>();
  @Output() readonly pageChange = new EventEmitter<{ column: BandejaColumnKey; pageNumber: number }>();
  @Output() readonly openDetail = new EventEmitter<PostulacionResponse>();

  protected getPage(column: BandejaColumnKey): PageResponse<PostulacionResponse> {
    return this.pages[column];
  }

  protected isLoading(column: BandejaColumnKey): boolean {
    return !!this.loadingByColumn[column];
  }

  protected getError(column: BandejaColumnKey): string {
    return this.errorByColumn[column] ?? '';
  }

  protected getAge(fechaNacimiento: string): number {
    const birthDate = new Date(`${fechaNacimiento}T00:00:00`);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDelta = today.getMonth() - birthDate.getMonth();

    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  protected toLabel(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
