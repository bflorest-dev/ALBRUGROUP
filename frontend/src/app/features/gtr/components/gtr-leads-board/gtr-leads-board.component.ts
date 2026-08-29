import { DatePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { PaginatorModule } from 'primeng/paginator';
import { PopoverModule } from 'primeng/popover';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { GtrWorkspaceFacade } from '../../facades/gtr-workspace.facade';
import { GtrLeadSelectControlComponent } from '../gtr-lead-select-control/gtr-lead-select-control.component';

@Component({
  selector: 'app-gtr-leads-board',
  imports: [
    DatePipe,
    UpperCasePipe,
    FormsModule,
    ButtonModule,
    CardModule,
    PaginatorModule,
    PopoverModule,
    SelectModule,
    TableModule,
    TagModule,
    GtrLeadSelectControlComponent
  ],
  templateUrl: './gtr-leads-board.component.html',
  styleUrl: './gtr-leads-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrLeadsBoardComponent {
  protected readonly facade = inject(GtrWorkspaceFacade);
  protected readonly visibleTipificationColumnOptions: { label: string; value: 'primera' | 'mayor' | 'ultima' }[] = [
    { label: 'Ultima', value: 'ultima' },
    { label: 'Mayor', value: 'mayor' },
    { label: 'Primera', value: 'primera' }
  ];
  protected visibleTipificationColumn: 'primera' | 'mayor' | 'ultima' = 'ultima';
  private organizeCloseTimeout: ReturnType<typeof setTimeout> | null = null;

  // Origen del lead: cada base se muestra como un icono con el texto en tooltip.
  // Referencias estables (cacheadas) para no romper el OnPush / PrimeNG.
  private readonly baseVisualMap: Record<string, { icon: string; label: string; tone: string }> = {
    WHATSAPP: { icon: 'pi pi-whatsapp', label: 'WhatsApp', tone: 'whatsapp' },
    MESSENGER: { icon: 'pi pi-facebook', label: 'Messenger', tone: 'messenger' },
    RECONTACTO: { icon: 'pi pi-replay', label: 'Recontacto', tone: 'recontacto' },
    PREDICTIVO: { icon: 'pi pi-phone', label: 'Predictivo', tone: 'predictivo' },
    REFERIDO: { icon: 'pi pi-share-alt', label: 'Referido', tone: 'referido' },
    MASIVO: { icon: 'pi pi-megaphone', label: 'Masivo', tone: 'masivo' },
    SIN_IDENTIFICAR: { icon: 'pi pi-question-circle', label: 'Sin identificar', tone: 'desconocido' }
  };
  private readonly baseVisualFallback = { icon: 'pi pi-question-circle', label: 'Sin identificar', tone: 'desconocido' };

  protected baseVisual(base?: string | null): { icon: string; label: string; tone: string } {
    if (!base) {
      return this.baseVisualFallback;
    }
    return this.baseVisualMap[base] ?? this.baseVisualFallback;
  }

  protected onOrganizeEnter(): void {
    if (this.organizeCloseTimeout !== null) {
      clearTimeout(this.organizeCloseTimeout);
      this.organizeCloseTimeout = null;
    }
  }

  protected onOrganizeLeave(popover: { hide: () => void }): void {
    this.onOrganizeEnter();
    this.organizeCloseTimeout = setTimeout(() => {
      popover.hide();
      this.organizeCloseTimeout = null;
    }, 180);
  }

  protected onGroupingModeChange(
    value: Parameters<GtrWorkspaceFacade['setPlatformGroupingMode']>[0]
  ): void {
    void this.facade.setPlatformGroupingMode(value);
  }

  protected onGroupChange(value: unknown): void {
    void this.facade.selectPlatformGroup(value as Parameters<GtrWorkspaceFacade['selectPlatformGroup']>[0]);
  }

  protected onTipificationGroupChange(value: unknown): void {
    void this.facade.selectPlatformTipificationGroup(
      value as Parameters<GtrWorkspaceFacade['selectPlatformTipificationGroup']>[0]
    );
  }

  protected onSubtipificationGroupChange(value: unknown): void {
    void this.facade.selectPlatformSubtipificationGroup(
      value as Parameters<GtrWorkspaceFacade['selectPlatformSubtipificationGroup']>[0]
    );
  }

  protected onSortFieldChange(
    value: Parameters<GtrWorkspaceFacade['setPlatformSortField']>[0]
  ): void {
    void this.facade.setPlatformSortField(value);
  }

  protected onSortDirectionChange(
    value: Parameters<GtrWorkspaceFacade['setPlatformSortDirection']>[0]
  ): void {
    void this.facade.setPlatformSortDirection(value);
  }

  protected onClearOrganization(): void {
    void this.facade.clearPlatformOrganization();
  }

  protected setVisibleTipificationColumn(value: 'primera' | 'mayor' | 'ultima'): void {
    this.visibleTipificationColumn = value;
  }
}
