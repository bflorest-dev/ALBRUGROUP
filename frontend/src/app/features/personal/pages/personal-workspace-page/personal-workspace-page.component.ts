import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from '../../../../core/services/session.service';
import { formatLabel } from '../../../../shared/utils/display-label';
import { EmployeeWorkspaceDrawerComponent } from '../../components/employee-workspace-drawer/employee-workspace-drawer.component';
import { PersonalCreationDrawerComponent } from '../../components/personal-creation-drawer/personal-creation-drawer.component';
import {
  PersonalCategoryFilter,
  PersonalDirectoryRow,
  personalScopeTypeForRole,
  PersonalWorkspaceFacade
} from '../../facades/personal-workspace.facade';

@Component({
  selector: 'app-personal-workspace-page',
  imports: [FormsModule, NgTemplateOutlet, EmployeeWorkspaceDrawerComponent, PersonalCreationDrawerComponent],
  providers: [PersonalWorkspaceFacade],
  templateUrl: './personal-workspace-page.component.html',
  styleUrl: './personal-workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PersonalWorkspacePageComponent {
  protected readonly facade = inject(PersonalWorkspaceFacade);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly theme = signal<'light' | 'dark'>(this.readTheme());
  protected readonly expandedCategories = signal(new Set(['OPERATIVO']));
  protected readonly expandedRoles = signal(new Set<string>());
  protected readonly expandedTeams = signal(new Set<string>());
  protected readonly creationVisible = signal(false);
  protected readonly activeRole = computed(() => this.session.getActiveRole());

  constructor() {
    void this.facade.initialize();
  }

  protected setCategoryFilter(value: PersonalCategoryFilter): void {
    this.facade.categoryFilter.set(value);
    const categoryToExpand = value === 'INACTIVO' ? 'SIN_CATEGORIA' : value;
    if (categoryToExpand !== 'TODOS') {
      this.expandedCategories.update((current) => new Set([...current, categoryToExpand]));
    }
  }

  protected toggleTheme(): void {
    const next = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(next);
    localStorage.setItem('personal-workspace-theme', next);
  }

  protected toggleCategory(category: string): void {
    this.expandedCategories.update((current) => this.toggled(current, category));
  }

  protected toggleRole(role: string): void {
    this.expandedRoles.update((current) => this.toggled(current, role));
  }

  protected toggleTeam(role: string, team: string): void {
    this.expandedTeams.update((current) => this.toggled(current, this.teamKey(role, team)));
  }

  protected isCategoryExpanded(category: string): boolean {
    return this.expandedCategories().has(category);
  }

  protected isRoleExpanded(role: string): boolean {
    return this.expandedRoles().has(role);
  }

  protected isTeamExpanded(role: string, team: string): boolean {
    return this.expandedTeams().has(this.teamKey(role, team));
  }

  protected label(value: string | null | undefined): string {
    return formatLabel(value);
  }

  protected initials(row: PersonalDirectoryRow): string {
    return `${row.employee.nombres.charAt(0)}${row.employee.apellidos.charAt(0)}`.toUpperCase();
  }

  protected preparation(row: PersonalDirectoryRow): { missing: string[]; summary: string } {
    const missing: string[] = [];
    if (!row.hasContract) missing.push('contrato');
    const hasAccess = !this.facade.canReadRoles() || !!row.access?.rolPrincipal;
    if (!hasAccess) missing.push('acceso');
    if (this.scopeState(row) === 'pending') missing.push('ámbito');
    return {
      missing,
      summary: missing.length ? `Falta ${missing.join(', ')}` : 'Sin pendientes conocidos'
    };
  }

  protected scopeState(row: PersonalDirectoryRow): 'done' | 'pending' | 'unknown' {
    const scopeType = personalScopeTypeForRole(row.primaryRole);
    if (scopeType === 'TEAM') return row.teamNames.length ? 'done' : 'pending';
    if (scopeType === 'PROVIDER') {
      if (!this.facade.canReadRoles() || this.facade.providerScopeStatus() !== 'ready') return 'unknown';
      return row.providerNames.length ? 'done' : 'pending';
    }
    return 'done';
  }

  protected openCreation(): void {
    this.creationVisible.set(true);
  }

  protected async closeCreation(changed: boolean): Promise<void> {
    this.creationVisible.set(false);
    if (changed) await this.facade.refresh();
  }

  protected openLegacySchedule(row: PersonalDirectoryRow): void {
    const route = this.activeRole() === 'RRHH' ? '/app/rrhh/personal' : '/app/admin/colaboradores/sin-equipo';
    void this.router.navigate([route], {
      queryParams: {
        empleadoId: row.employee.idEmpleado,
        dni: row.employee.numeroDocumento,
        accion: 'horario'
      }
    });
  }

  protected async handleEmployeeChanged(): Promise<void> {
    await this.facade.refresh();
  }

  private toggled(current: Set<string>, key: string): Set<string> {
    const next = new Set(current);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  }

  private teamKey(role: string, team: string): string {
    return `${role}:${team}`;
  }

  private readTheme(): 'light' | 'dark' {
    const stored = localStorage.getItem('personal-workspace-theme');
    return stored === 'dark' ? 'dark' : 'light';
  }
}
