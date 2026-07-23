import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PhoneNumberFieldComponent } from '../../../../shared/components/phone-number-field/phone-number-field.component';
import { CommunitySection, CommunityWorkspaceFacade } from '../../facades/community-workspace.facade';
import { CampanaResponse } from '../../services/community-lead.service';

export const CATALOG_MAINTENANCE_SECTIONS: { id: CommunitySection; label: string; icon: string }[] = [
  { id: 'proveedores', label: 'Proveedores', icon: 'pi pi-building' },
  { id: 'cuentas', label: 'Cuentas', icon: 'pi pi-credit-card' },
  { id: 'campanas', label: 'Campañas', icon: 'pi pi-megaphone' },
  { id: 'zonas', label: 'Zonas', icon: 'pi pi-map-marker' },
  { id: 'planes', label: 'Planes', icon: 'pi pi-wifi' },
  { id: 'promociones', label: 'Promociones', icon: 'pi pi-tags' },
  { id: 'plataformas-digitales', label: 'Plataformas', icon: 'pi pi-key' }
];

@Component({
  selector: 'app-catalog-maintenance-panel',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    MultiSelectModule,
    SelectModule,
    SelectButtonModule,
    TableModule,
    TabsModule,
    TagModule,
    ToggleSwitchModule,
    PhoneNumberFieldComponent
  ],
  templateUrl: './catalog-maintenance-panel.component.html',
  styleUrl: './catalog-maintenance-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ConfirmationService]
})
export class CatalogMaintenancePanelComponent {
  protected readonly facade = inject(CommunityWorkspaceFacade);
  private readonly confirmationService = inject(ConfirmationService);
  protected readonly sections = CATALOG_MAINTENANCE_SECTIONS;

  protected preventNonInteger(event: KeyboardEvent): void {
    const allowed = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowed.includes(event.key) || event.ctrlKey || event.metaKey) return;
    if (!/^\d$/.test(event.key)) event.preventDefault();
  }

  protected display(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    return String(value);
  }

  protected statusLabel(active: boolean | undefined): string {
    return active === false ? 'Inactivo' : 'Activo';
  }

  protected statusSeverity(active: boolean | undefined): 'success' | 'danger' {
    return active === false ? 'danger' : 'success';
  }

  protected confirmCampaignToggle(campana: CampanaResponse): void {
    if (campana.activo === false) {
      void this.facade.toggleCampaign(campana.id);
      return;
    }

    const campaignName = this.display(campana.nombre);
    this.confirmationService.confirm({
      header: 'Desactivar campaña',
      message: `La campaña ${campaignName} dejará de estar disponible para nuevos registros. ¿Deseas desactivarla?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        void this.facade.toggleCampaign(campana.id);
      }
    });
  }

  protected criterionSeverity(criterion: string): 'success' | 'danger' {
    return criterion === 'INCLUIR' ? 'success' : 'danger';
  }

  protected zoneDialogTitle(): string {
    return this.facade.zoneDialogMode() === 'edit' ? 'Editar zona' : 'Agregar zona';
  }

  protected listCount(value: unknown): number {
    return Array.isArray(value) ? value.length : 0;
  }

  protected money(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return `S/ ${value}`;
  }

  protected compactDatePart(value: string | null | undefined): string {
    const date = this.parseDate(value);
    if (!date) {
      return '-';
    }
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }

  protected compactTimePart(value: string | null | undefined): string {
    const date = this.parseDate(value);
    if (!date) {
      return '-';
    }
    return new Intl.DateTimeFormat('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  }

  protected scopeLabel(value: unknown, fallback: string): string {
    return value === null || value === undefined || value === '' ? fallback : String(value);
  }

  protected planScopeLabel(names: unknown, ids: unknown): string {
    if (Array.isArray(names) && names.length) {
      return names.join(', ');
    }
    if (Array.isArray(ids) && ids.length) {
      return ids.join(', ');
    }
    return 'Todos';
  }

  private parseDate(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
