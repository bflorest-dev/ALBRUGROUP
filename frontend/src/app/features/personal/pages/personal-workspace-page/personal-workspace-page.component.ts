import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from '../../../../core/services/session.service';
import { TokenService } from '../../../../core/services/token.service';
import { formatLabel } from '../../../../shared/utils/display-label';
import { AttendanceReportDrawerComponent } from '../../components/attendance-report-drawer/attendance-report-drawer.component';
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
  imports: [FormsModule, NgTemplateOutlet, AttendanceReportDrawerComponent, EmployeeWorkspaceDrawerComponent, PersonalCreationDrawerComponent],
  providers: [PersonalWorkspaceFacade],
  templateUrl: './personal-workspace-page.component.html',
  styleUrl: './personal-workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PersonalWorkspacePageComponent {
  protected readonly facade = inject(PersonalWorkspaceFacade);
  private readonly session = inject(SessionService);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  protected readonly theme = signal<'light' | 'dark'>(this.readTheme());
  protected readonly expandedCategories = signal(new Set(['OPERATIVO']));
  protected readonly expandedRoles = signal(new Set<string>());
  protected readonly expandedTeams = signal(new Set<string>());
  protected readonly creationVisible = signal(false);
  protected readonly reportDrawerVisible = signal(false);
  protected readonly canExportAttendance = computed(() => this.tokenService.hasPermission('EXPORT_REPORTE_ASISTENCIA'));
  protected readonly rolePickerVisible = signal(false);
  protected readonly rolePickerSearch = signal('');
  protected readonly activeRole = computed(() => this.session.getActiveRole());
  protected readonly filteredRoleOptions = computed(() => {
    const query = this.rolePickerSearch().trim().toLocaleLowerCase('es');
    return this.facade.roleOptions().filter((role) =>
      !query || this.label(role).toLocaleLowerCase('es').includes(query)
    );
  });

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
    if (this.expandedCategories().has(category)) {
      return true;
    }

    if (!this.hasActiveSearch()) {
      return false;
    }

    if (category === 'SIN_CATEGORIA') {
      return this.facade.unclassifiedRows().length > 0;
    }
    if (category === 'ESTRUCTURAL') {
      return this.facade.structuralRows().length > 0;
    }
    if (category === 'OPERATIVO') {
      return this.facade.operationalGroups().length > 0;
    }
    return false;
  }

  protected isRoleExpanded(role: string): boolean {
    return this.expandedRoles().has(role)
      || (this.hasActiveSearch() && this.facade.operationalGroups().some((group) => group.role === role));
  }

  protected isTeamExpanded(role: string, team: string): boolean {
    if (this.expandedTeams().has(this.teamKey(role, team))) {
      return true;
    }

    if (!this.hasActiveSearch()) {
      return false;
    }

    return this.facade.operationalGroups().some((group) =>
      group.role === role
      && (group.teams.some((item) => item.key === team) || group.providers.some((item) => item.key === team))
    );
  }

  protected label(value: string | null | undefined): string {
    return formatLabel(value);
  }

  protected openRolePicker(): void {
    this.rolePickerSearch.set('');
    this.rolePickerVisible.set(true);
  }

  protected closeRolePicker(): void {
    this.rolePickerVisible.set(false);
    this.rolePickerSearch.set('');
  }

  protected selectRoleFilter(value: string): void {
    this.facade.roleFilter.set(value);
    this.closeRolePicker();
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

  protected openReportDrawer(): void {
    this.reportDrawerVisible.set(true);
  }

  protected closeReportDrawer(): void {
    this.reportDrawerVisible.set(false);
  }

  private toggled(current: Set<string>, key: string): Set<string> {
    const next = new Set(current);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  }

  private teamKey(role: string, team: string): string {
    return `${role}:${team}`;
  }

  private hasActiveSearch(): boolean {
    return this.facade.search().trim().length > 0;
  }

  private readTheme(): 'light' | 'dark' {
    const stored = localStorage.getItem('personal-workspace-theme');
    return stored === 'dark' ? 'dark' : 'light';
  }
}
