import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, effect, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { DrawerModule } from 'primeng/drawer';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { PhoneNumberFieldComponent } from '../../../../shared/components/phone-number-field/phone-number-field.component';
import { CommunityPageMode, CommunitySection, CommunityWorkspaceFacade } from '../../facades/community-workspace.facade';

@Component({
  selector: 'app-community-workspace-page',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    DialogModule,
    DrawerModule,
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
  providers: [CommunityWorkspaceFacade],
  templateUrl: './community-workspace-page.component.html',
  styleUrl: './community-workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommunityWorkspacePageComponent implements OnInit {
  protected readonly facade = inject(CommunityWorkspaceFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly pageMode = signal<CommunityPageMode>('mantenimiento');
  protected readonly sections: { id: CommunitySection; label: string; icon: string; disabled?: boolean }[] = [
    { id: 'proveedores', label: 'Proveedores', icon: 'pi pi-building' },
    { id: 'cuentas', label: 'Cuentas', icon: 'pi pi-credit-card' },
    { id: 'campanas', label: 'Campañas', icon: 'pi pi-megaphone' },
    { id: 'zonas', label: 'Zonas', icon: 'pi pi-map-marker' },
    { id: 'planes', label: 'Planes', icon: 'pi pi-wifi' },
    { id: 'promociones', label: 'Promociones', icon: 'pi pi-tags' }
  ];

  constructor() {
    // Restaurar la tab activa desde la URL al recargar (lectura sincrónica antes del primer effect)
    const savedTab = this.route.snapshot.queryParams['tab'] as CommunitySection | undefined;
    if (savedTab && this.sections.some((s) => s.id === savedTab)) {
      this.facade.setSection(savedTab);
    }

    // Mantener la URL sincronizada cuando el usuario cambia de tab (sin disparar navegación)
    effect(() => {
      const section = this.facade.section();
      if (this.pageMode() !== 'mantenimiento') return;
      const urlTree = this.router.createUrlTree([], {
        relativeTo: this.route,
        queryParams: { tab: section },
        queryParamsHandling: 'merge'
      });
      this.location.replaceState(this.router.serializeUrl(urlTree));
    });
  }

  ngOnInit(): void {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      const mode: CommunityPageMode =
        data['section'] === 'finanzas' ? 'finanzas' : data['section'] === 'metricas' ? 'metricas' : 'mantenimiento';
      this.pageMode.set(mode);
      void this.facade.initialize(mode);
    });
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
