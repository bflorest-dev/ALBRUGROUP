import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { PhoneNumberFieldComponent } from '../../../../shared/components/phone-number-field/phone-number-field.component';
import { CommunitySection, CommunityWorkspaceFacade } from '../../facades/community-workspace.facade';

export const CATALOG_MAINTENANCE_SECTIONS: { id: CommunitySection; label: string; icon: string }[] = [
  { id: 'proveedores', label: 'Proveedores', icon: 'pi pi-building' },
  { id: 'cuentas', label: 'Cuentas', icon: 'pi pi-credit-card' },
  { id: 'campanas', label: 'Campañas', icon: 'pi pi-megaphone' },
  { id: 'zonas', label: 'Zonas', icon: 'pi pi-map-marker' },
  { id: 'planes', label: 'Planes', icon: 'pi pi-wifi' },
  { id: 'promociones', label: 'Promociones', icon: 'pi pi-tags' }
];

@Component({
  selector: 'app-catalog-maintenance-panel',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    MultiSelectModule,
    SelectModule,
    SelectButtonModule,
    TableModule,
    TabsModule,
    TagModule,
    PhoneNumberFieldComponent
  ],
  templateUrl: './catalog-maintenance-panel.component.html',
  styleUrl: './catalog-maintenance-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogMaintenancePanelComponent {
  protected readonly facade = inject(CommunityWorkspaceFacade);
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
}
