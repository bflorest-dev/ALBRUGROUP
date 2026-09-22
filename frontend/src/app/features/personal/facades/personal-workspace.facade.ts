import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SessionService } from '../../../core/services/session.service';
import { EmpleadoRolResponse } from '../../../shared/models/rrhh/empleado-rol-response';
import { EmpleadoResponse } from '../../../shared/models/rrhh/empleado-response';
import { formatApiErrorMessage } from '../../../shared/utils/api-error.utils';
import { TEAM_SCOPED_ROLES } from '../../../shared/constants/multi-team-roles';
import { AdminEquipoService, EquipoResponse, ProveedorLite } from '../../admin/services/admin-equipo.service';
import { AdminRrhhService } from '../../admin/services/admin-rrhh.service';
import {
  PersonalAccessService,
  RoleCatalogItem,
  UserAccessSummary,
  UserRoles
} from '../services/personal-access.service';

export type PersonalCategoryFilter = 'TODOS' | 'OPERATIVO' | 'ESTRUCTURAL' | 'INACTIVO';

export interface PersonalDirectoryRow {
  employee: EmpleadoRolResponse;
  access: UserAccessSummary | null;
  category: 'OPERATIVO' | 'ESTRUCTURAL' | 'SIN_CATEGORIA';
  hasContract: boolean;
  primaryRole: string;
  secondaryRoles: string[];
  teamNames: string[];
  teamIds: number[];
  providerNames: string[];
}

export interface PersonalTeamGroup {
  key: string;
  label: string;
  employees: PersonalDirectoryRow[];
}

export interface PersonalRoleGroup {
  role: string;
  employees: PersonalDirectoryRow[];
  usesTeams: boolean;
  teams: PersonalTeamGroup[];
}

@Injectable()
export class PersonalWorkspaceFacade {
  private readonly teamScopedRoles = new Set(TEAM_SCOPED_ROLES);
  private readonly rrhh = inject(AdminRrhhService);
  private readonly teamsService = inject(AdminEquipoService);
  private readonly accessService = inject(PersonalAccessService);
  private readonly session = inject(SessionService);

  readonly employees = signal<EmpleadoRolResponse[]>([]);
  readonly roleCatalog = signal<RoleCatalogItem[]>([]);
  readonly accessByEmployeeId = signal<Record<number, UserAccessSummary>>({});
  readonly teamNamesByEmployeeId = signal<Record<number, string[]>>({});
  readonly teamIdsByEmployeeId = signal<Record<number, number[]>>({});
  readonly activeTeams = signal<EquipoResponse[]>([]);
  readonly providerNamesByEmployeeId = signal<Record<number, string[]>>({});
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly search = signal('');
  readonly categoryFilter = signal<PersonalCategoryFilter>('TODOS');
  readonly roleFilter = signal('');
  readonly showHiddenRoles = signal(false);
  readonly selectedEmployeeId = signal<number | null>(null);

  readonly isAdmin = computed(() => this.session.getActiveRole() === 'ADMINISTRADOR');
  readonly canReadRoles = computed(() => ['ADMINISTRADOR', 'RRHH'].includes(this.session.getActiveRole() ?? ''));
  readonly selectedRow = computed(() =>
    this.rows().find((row) => row.employee.idEmpleado === this.selectedEmployeeId()) ?? null
  );

  readonly rows = computed<PersonalDirectoryRow[]>(() => {
    const access = this.accessByEmployeeId();
    const teamNames = this.teamNamesByEmployeeId();
    const teamIds = this.teamIdsByEmployeeId();
    const providerNames = this.providerNamesByEmployeeId();
    const term = this.normalize(this.search());
    const categoryFilter = this.categoryFilter();
    const roleFilter = this.roleFilter();

    return this.employees()
      .map((employee): PersonalDirectoryRow => {
        const employeeAccess = access[employee.idEmpleado] ?? null;
        const legacyPosition = employee.puestoTrabajo && employee.puestoTrabajo !== 'SIN_CONTRATO'
          ? employee.puestoTrabajo
          : null;
        const primaryRole = employeeAccess?.rolPrincipal || legacyPosition || 'SIN_ROL';
        const category = employee.categoriaPersonal
          ?? (legacyPosition ? this.inferCategory(legacyPosition) : 'SIN_CATEGORIA');
        return {
          employee,
          access: employeeAccess,
          category,
          hasContract: Boolean(employee.categoriaPersonal || legacyPosition),
          primaryRole,
          secondaryRoles: employeeAccess?.rolesSecundarios ?? [],
          teamNames: teamNames[employee.idEmpleado] ?? [],
          teamIds: teamIds[employee.idEmpleado] ?? [],
          providerNames: providerNames[employee.idEmpleado] ?? []
        };
      })
      .filter((row) => {
        if (!this.showHiddenRoles() && row.primaryRole === 'OJT') return false;
        const expectedState = categoryFilter === 'INACTIVO' ? 'INACTIVO' : 'ACTIVO';
        if (row.employee.estadoOperativo !== expectedState) return false;
        if (categoryFilter !== 'TODOS' && categoryFilter !== 'INACTIVO' && row.category !== categoryFilter) return false;
        if (roleFilter && row.primaryRole !== roleFilter) return false;
        if (!term) return true;
        return this.normalize([
          row.employee.nombres,
          row.employee.apellidos,
          row.employee.numeroDocumento,
          row.employee.correoPersonal,
          row.access?.username,
          row.primaryRole,
          ...row.secondaryRoles,
          ...row.teamNames,
          ...row.providerNames
        ].filter(Boolean).join(' ')).includes(term);
      })
      .sort((left, right) => this.fullName(left).localeCompare(this.fullName(right), 'es'));
  });

  readonly structuralRows = computed(() => this.rows().filter((row) => row.category === 'ESTRUCTURAL'));
  readonly unclassifiedRows = computed(() => this.rows().filter((row) => row.category === 'SIN_CATEGORIA'));
  readonly operationalGroups = computed<PersonalRoleGroup[]>(() => {
    const roles = new Map<string, PersonalDirectoryRow[]>();
    for (const row of this.rows().filter((candidate) => candidate.category === 'OPERATIVO')) {
      roles.set(row.primaryRole, [...(roles.get(row.primaryRole) ?? []), row]);
    }
    return [...roles.entries()]
      .map(([role, employees]) => {
        const usesTeams = this.teamScopedRoles.has(role);
        return {
          role,
          employees,
          usesTeams,
          teams: usesTeams ? this.groupByTeam(employees) : []
        };
      })
      .sort((left, right) => left.role.localeCompare(right.role, 'es'));
  });

  readonly visibleCount = computed(() => this.rows().length);
  readonly totalCount = computed(() => this.employees().length);
  readonly roleOptions = computed(() => {
    const names = this.roleCatalog().map((role) => role.nombre);
    if (names.length) return names;
    return [...new Set(this.employees().map((employee) => employee.puestoTrabajo).filter(Boolean) as string[])].sort();
  });

  async initialize(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const [employees, activeEmployment] = await Promise.all([
        this.loadEmployeeDirectory(),
        firstValueFrom(this.rrhh.listarEmpleadosLight())
      ]);
      this.employees.set(this.mergeEmploymentData(employees, activeEmployment));
      await Promise.all([
        this.loadTeams(),
        this.canReadRoles() ? this.loadRoleDirectory() : Promise.resolve(),
        this.isAdmin() ? this.loadAdminProviderScopes() : Promise.resolve()
      ]);
    } catch (error) {
      this.errorMessage.set(formatApiErrorMessage(error as HttpErrorResponse, 'No se pudo cargar el personal.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  async refresh(): Promise<void> {
    await this.initialize();
  }

  selectEmployee(empleadoId: number): void {
    this.selectedEmployeeId.set(empleadoId);
  }

  closeEmployee(): void {
    this.selectedEmployeeId.set(null);
  }

  applyUpdatedRoles(roles: UserRoles): void {
    this.accessByEmployeeId.update((current) => {
      const existing = current[roles.empleadoId];
      if (!existing) return current;
      return {
        ...current,
        [roles.empleadoId]: {
          ...existing,
          rolPrincipal: roles.rolPrincipal,
          rolesSecundarios: roles.rolesSecundarios,
          rolesAsignados: roles.rolesAsignados
        }
      };
    });
  }

  private async loadRoleDirectory(): Promise<void> {
    const [catalog, users] = await Promise.all([
      firstValueFrom(this.accessService.listRoles()),
      this.loadAllAccessUsers()
    ]);
    this.roleCatalog.set(catalog);
    this.accessByEmployeeId.set(Object.fromEntries(users.map((item) => [item.empleadoId, item])));
  }

  private async loadAdminProviderScopes(): Promise<void> {
    try {
      const [providers, backoffice, postventa] = await Promise.all([
        firstValueFrom(this.teamsService.listarProveedores()),
        firstValueFrom(this.teamsService.listarAsignacionesProveedor('BACKOFFICE')),
        firstValueFrom(this.teamsService.listarAsignacionesProveedor('POSTVENTA'))
      ]);
      this.providerNamesByEmployeeId.set(this.resolveProviderNames(providers, [...backoffice, ...postventa]));
    } catch {
      this.providerNamesByEmployeeId.set({});
    }
  }

  private async loadTeams(): Promise<void> {
    try {
      const teams = (await firstValueFrom(this.teamsService.listarEquipos())).filter((team) => team.activo);
      this.activeTeams.set(teams);
      await this.loadTeamMembers(teams);
    } catch {
      this.activeTeams.set([]);
      this.teamNamesByEmployeeId.set({});
      this.teamIdsByEmployeeId.set({});
    }
  }

  private async loadAllAccessUsers(): Promise<UserAccessSummary[]> {
    const firstPage = await firstValueFrom(this.accessService.listUsers({ page: 0, size: 100 }));
    if (firstPage.totalPages <= 1) return firstPage.content;
    const remaining = await Promise.all(
      Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
        firstValueFrom(this.accessService.listUsers({ page: index + 1, size: 100 }))
      )
    );
    return [firstPage, ...remaining].flatMap((page) => page.content);
  }

  private async loadTeamMembers(teams: EquipoResponse[]): Promise<void> {
    const membership = await Promise.all(teams.map(async (team) => ({
      team,
      members: await firstValueFrom(this.teamsService.listarMiembros(team.id))
    })));
    const names: Record<number, string[]> = {};
    const ids: Record<number, number[]> = {};
    for (const item of membership) {
      for (const member of item.members) {
        (names[member.empleadoId] ??= []).push(item.team.nombre);
        (ids[member.empleadoId] ??= []).push(item.team.id);
      }
    }
    this.teamNamesByEmployeeId.set(names);
    this.teamIdsByEmployeeId.set(ids);
  }

  private resolveProviderNames(
    providers: ProveedorLite[],
    assignments: Array<{ idEmpleado: number; proveedorIds: number[] }>
  ): Record<number, string[]> {
    const providerById = new Map(providers.map((provider) => [provider.id, provider.nombre]));
    const result: Record<number, string[]> = {};
    for (const assignment of assignments) {
      const current = new Set(result[assignment.idEmpleado] ?? []);
      for (const id of assignment.proveedorIds) {
        const name = providerById.get(id);
        if (name) current.add(name);
      }
      result[assignment.idEmpleado] = [...current].sort((left, right) => left.localeCompare(right, 'es'));
    }
    return result;
  }

  private groupByTeam(employees: PersonalDirectoryRow[]): PersonalTeamGroup[] {
    const grouped = new Map<string, PersonalDirectoryRow[]>();
    for (const row of employees) {
      const label = row.teamNames.length > 1
        ? 'Varios equipos'
        : row.teamNames[0] || 'Sin equipo';
      grouped.set(label, [...(grouped.get(label) ?? []), row]);
    }
    return [...grouped.entries()]
      .map(([label, rows]) => ({ key: this.normalize(label).replace(/\s+/g, '-'), label, employees: rows }))
      .sort((left, right) => {
        if (left.label === 'Sin equipo') return 1;
        if (right.label === 'Sin equipo') return -1;
        return left.label.localeCompare(right.label, 'es');
      });
  }

  private inferCategory(role: string): 'OPERATIVO' | 'ESTRUCTURAL' {
    return ['ASESOR_GTR', 'SUPERVISOR_GTR', 'ASESOR_VENTAS', 'SUPERVISOR_VENTAS', 'OJT', 'FREELANCE',
      'ASESOR_BACKOFFICE', 'SUPERVISOR_BACKOFFICE', 'ASESOR_POSTVENTA', 'SUPERVISOR_POSTVENTA',
      'MONITOR', 'COMMUNITY'].includes(role) ? 'OPERATIVO' : 'ESTRUCTURAL';
  }

  private async loadEmployeeDirectory(): Promise<EmpleadoResponse[]> {
    const [active, inactive] = await Promise.all([
      this.loadEmployeesByState('ACTIVO'),
      this.loadEmployeesByState('INACTIVO')
    ]);
    const employeesById = new Map([...active, ...inactive].map((employee) => [employee.id, employee]));
    return [...employeesById.values()];
  }

  private async loadEmployeesByState(state: 'ACTIVO' | 'INACTIVO'): Promise<EmpleadoResponse[]> {
    const firstPage = await firstValueFrom(this.rrhh.getEmpleados(0, 100, state));
    if (firstPage.totalPages <= 1) return firstPage.content;
    const remaining = await Promise.all(
      Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
        firstValueFrom(this.rrhh.getEmpleados(index + 1, 100, state))
      )
    );
    return [firstPage, ...remaining].flatMap((page) => page.content);
  }

  private mergeEmploymentData(
    employees: EmpleadoResponse[],
    activeEmployment: EmpleadoRolResponse[]
  ): EmpleadoRolResponse[] {
    const employmentById = new Map(activeEmployment.map((employee) => [employee.idEmpleado, employee]));
    return employees.map((employee) => {
      const employment = employmentById.get(employee.id);
      return {
        idEmpleado: employee.id,
        nombres: employee.nombres,
        apellidos: employee.apellidos,
        numeroDocumento: employee.numeroDocumento,
        celularPersonal: employee.celularPersonal,
        correoPersonal: employee.correoPersonal,
        categoriaPersonal: employment?.categoriaPersonal,
        puestoTrabajo: employment?.puestoTrabajo ?? 'SIN_CONTRATO',
        estadoOperativo: employee.estadoOperativo === 'INACTIVO' ? 'INACTIVO' : 'ACTIVO'
      };
    });
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  private fullName(row: PersonalDirectoryRow): string {
    return `${row.employee.nombres} ${row.employee.apellidos}`;
  }
}
