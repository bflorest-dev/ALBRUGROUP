import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { catchError, firstValueFrom, of, Subscription } from 'rxjs';
import { AttendanceRealtimeService } from '../../../core/services/attendance-realtime.service';
import { PresenceRealtimeService } from '../../../core/services/presence-realtime.service';
import { ConnectedUserResponse, PresenceService } from '../../../core/services/presence.service';
import { SessionService } from '../../../core/services/session.service';
import { AttendanceRealtimeEvent } from '../../../shared/models/schedule/attendance-realtime-event';
import { EmpleadoRolResponse } from '../../../shared/models/rrhh/empleado-rol-response';
import { EmpleadoResponse } from '../../../shared/models/rrhh/empleado-response';
import { formatApiErrorMessage } from '../../../shared/utils/api-error.utils';
import { PresenceRealtimeEvent } from '../../../shared/models/gateway/presence-realtime-event';
import {
  ambitoProveedorPorRol,
  ProviderScope,
  PROVIDER_SCOPED_ROLES,
  TEAM_SCOPED_ROLES
} from '../../../shared/constants/multi-team-roles';
import { AdminEquipoService, EquipoResponse, ProveedorLite } from '../../admin/services/admin-equipo.service';
import { AdminRrhhService } from '../../admin/services/admin-rrhh.service';
import {
  PersonalAccessService,
  RoleCatalogItem,
  UserAccessSummary,
  UserRoles
} from '../services/personal-access.service';

export type PersonalCategoryFilter = 'TODOS' | 'OPERATIVO' | 'ESTRUCTURAL' | 'MANTENIMIENTO' | 'INACTIVO';

export type PersonalPresenceStatus =
  | 'ONLINE'
  | 'OFFLINE'
  | 'ALMUERZO'
  | 'SERVICIOS'
  | 'PAUSA_ACTIVA'
  | 'CAPACITACION'
  | 'DISPONIBLE'
  | 'CON_LEADS'
  | 'GESTIONANDO'
  | 'SIN_GESTIONAR'
  | 'OCUPADO'
  | 'SATURADO';

const PERSONAL_PRESENCE_STATUSES = new Set<string>([
  'ONLINE',
  'OFFLINE',
  'ALMUERZO',
  'SERVICIOS',
  'PAUSA_ACTIVA',
  'CAPACITACION',
  'DISPONIBLE',
  'CON_LEADS',
  'GESTIONANDO',
  'SIN_GESTIONAR',
  'OCUPADO',
  'SATURADO'
]);

export interface PersonalDirectoryRow {
  employee: EmpleadoRolResponse;
  access: UserAccessSummary | null;
  category: 'OPERATIVO' | 'ESTRUCTURAL' | 'MANTENIMIENTO' | 'SIN_CATEGORIA';
  hasContract: boolean;
  primaryRole: string;
  secondaryRoles: string[];
  teamNames: string[];
  teamIds: number[];
  providerIds: number[];
  providerNames: string[];
}

export interface PersonalTeamGroup {
  key: string;
  label: string;
  employees: PersonalDirectoryRow[];
}

export interface PersonalProviderGroup {
  key: string;
  label: string;
  employees: PersonalDirectoryRow[];
}

export type PersonalScopeType = 'TEAM' | 'PROVIDER' | 'NONE';

export interface PersonalRoleGroup {
  role: string;
  employees: PersonalDirectoryRow[];
  scopeType: PersonalScopeType;
  usesTeams: boolean;
  teams: PersonalTeamGroup[];
  providers: PersonalProviderGroup[];
}

export interface PersonalProviderEntry {
  id: number;
  name: string;
}

export type PersonalProviderAssignments = Record<number, PersonalProviderEntry[]>;

export function personalScopeTypeForRole(role: string): PersonalScopeType {
  if (TEAM_SCOPED_ROLES.includes(role)) return 'TEAM';
  if (PROVIDER_SCOPED_ROLES[role]) return 'PROVIDER';
  return 'NONE';
}

export function resolveProviderAssignments(
  providers: ProveedorLite[],
  assignments: Array<{ idEmpleado: number; proveedorIds: number[] }>
): PersonalProviderAssignments {
  const providerById = new Map(providers.map((provider) => [provider.id, provider.nombre]));
  const entriesByEmployee = new Map<number, Map<number, string>>();
  for (const assignment of assignments) {
    const entries = entriesByEmployee.get(assignment.idEmpleado) ?? new Map<number, string>();
    for (const providerId of assignment.proveedorIds) {
      const name = providerById.get(providerId);
      if (name) entries.set(providerId, name);
    }
    entriesByEmployee.set(assignment.idEmpleado, entries);
  }
  return Object.fromEntries([...entriesByEmployee.entries()].map(([employeeId, entries]) => [
    employeeId,
    [...entries.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name, 'es'))
  ]));
}

export function groupPersonalRowsByTeam(employees: PersonalDirectoryRow[]): PersonalTeamGroup[] {
  const grouped = new Map<string, PersonalDirectoryRow[]>();
  for (const row of employees) {
    const label = row.teamNames.length > 1
      ? 'Varios equipos'
      : row.teamNames[0] || 'Sin equipo';
    grouped.set(label, [...(grouped.get(label) ?? []), row]);
  }
  return [...grouped.entries()]
    .map(([label, rows]) => ({ key: normalizeScopeLabel(label), label, employees: rows }))
    .sort((left, right) => {
      if (left.label === 'Sin equipo') return 1;
      if (right.label === 'Sin equipo') return -1;
      return left.label.localeCompare(right.label, 'es');
    });
}

export function groupPersonalRowsByProvider(employees: PersonalDirectoryRow[]): PersonalProviderGroup[] {
  const grouped = new Map<number, PersonalDirectoryRow[]>();
  const withoutProvider: PersonalDirectoryRow[] = [];
  for (const row of employees) {
    let groupedInProvider = false;
    row.providerIds.forEach((providerId, index) => {
      const providerName = row.providerNames[index];
      if (!providerName) return;
      groupedInProvider = true;
      grouped.set(providerId, [...(grouped.get(providerId) ?? []), row]);
    });
    if (!groupedInProvider) withoutProvider.push(row);
  }
  const groups = [...grouped.entries()]
    .map(([providerId, rows]) => ({
      key: `proveedor-${providerId}`,
      label: rows[0]?.providerNames[rows[0].providerIds.indexOf(providerId)] ?? `Proveedor ${providerId}`,
      employees: rows
    }))
    .sort((left, right) => left.label.localeCompare(right.label, 'es'));
  if (withoutProvider.length) groups.push({ key: 'sin-proveedor', label: 'Sin proveedor', employees: withoutProvider });
  return groups;
}

function normalizeScopeLabel(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '-');
}

type PersonalProviderAssignmentsByScope = Record<ProviderScope, PersonalProviderAssignments>;

@Injectable()
export class PersonalWorkspaceFacade implements OnDestroy {
  private readonly rrhh = inject(AdminRrhhService);
  private readonly teamsService = inject(AdminEquipoService);
  private readonly accessService = inject(PersonalAccessService);
  private readonly session = inject(SessionService);
  private readonly presenceService = inject(PresenceService);
  private readonly presenceRealtimeService = inject(PresenceRealtimeService);
  private readonly attendanceRealtimeService = inject(AttendanceRealtimeService);
  private readonly realtimeSubscription = new Subscription();
  private realtimeStarted = false;

  readonly employees = signal<EmpleadoRolResponse[]>([]);
  readonly roleCatalog = signal<RoleCatalogItem[]>([]);
  readonly accessByEmployeeId = signal<Record<number, UserAccessSummary>>({});
  readonly teamNamesByEmployeeId = signal<Record<number, string[]>>({});
  readonly teamIdsByEmployeeId = signal<Record<number, number[]>>({});
  readonly activeTeams = signal<EquipoResponse[]>([]);
  readonly activeProviders = signal<ProveedorLite[]>([]);
  readonly providerAssignmentsByScope = signal<PersonalProviderAssignmentsByScope>({
    BACKOFFICE: {},
    POSTVENTA: {},
    PREVENTA: {}
  });
  readonly providerScopeStatus = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  readonly providerScopeError = signal('');
  readonly accessDirectoryWarning = signal('');
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly search = signal('');
  readonly categoryFilter = signal<PersonalCategoryFilter>('TODOS');
  readonly roleFilter = signal('');
  readonly companyFilter = signal<string | null>(null);
  readonly showHiddenRoles = signal(false);
  readonly selectedEmployeeId = signal<number | null>(null);
  readonly connectedUserById = signal<Record<number, ConnectedUserResponse>>({});
  readonly attendanceStateById = signal<Record<number, string | null>>({});
  readonly isLoadingLiveState = signal(false);

  readonly isAdmin = computed(() => this.session.getActiveRole() === 'ADMINISTRADOR');
  readonly canReadRoles = computed(() => ['ADMINISTRADOR', 'RRHH'].includes(this.session.getActiveRole() ?? ''));
  readonly selectedRow = computed(() =>
    this.rows().find((row) => row.employee.idEmpleado === this.selectedEmployeeId()) ?? null
  );

  readonly companyOptions = computed<string[]>(() => {
    const unique = new Set<string>();
    for (const emp of this.employees()) {
      if (emp.empresaContratista) unique.add(emp.empresaContratista.toUpperCase());
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'es'));
  });

  readonly rows = computed<PersonalDirectoryRow[]>(() => {
    const access = this.accessByEmployeeId();
    const teamNames = this.teamNamesByEmployeeId();
    const teamIds = this.teamIdsByEmployeeId();
    const providerAssignments = this.providerAssignmentsByScope();
    const term = this.normalize(this.search());
    const categoryFilter = this.categoryFilter();
    const roleFilter = this.roleFilter();
    const companyFilter = this.companyFilter();

    return this.employees()
      .map((employee): PersonalDirectoryRow => {
        const employeeAccess = access[employee.idEmpleado] ?? null;
        const legacyPosition = employee.puestoTrabajo && employee.puestoTrabajo !== 'SIN_CONTRATO'
          ? employee.puestoTrabajo
          : null;
        const primaryRole = employeeAccess?.rolPrincipal || legacyPosition || 'SIN_ROL';
        const category = employee.categoriaPersonal
          ?? (legacyPosition ? this.inferCategory(legacyPosition) : 'SIN_CATEGORIA');
        const assignedRoles = [primaryRole, ...(employeeAccess?.rolesSecundarios ?? [])];
        const providerEntries = assignedRoles
          .filter((role) => Boolean(ambitoProveedorPorRol(role)))
          .flatMap((role) => {
            const scope = ambitoProveedorPorRol(role);
            return scope ? providerAssignments[scope][employee.idEmpleado] ?? [] : [];
          })
          .filter((entry, index, entries) => entries.findIndex((candidate) => candidate.id === entry.id) === index)
          .sort((left, right) => left.name.localeCompare(right.name, 'es'));
        return {
          employee,
          access: employeeAccess,
          category,
          hasContract: Boolean(employee.categoriaPersonal || legacyPosition),
          primaryRole,
          secondaryRoles: employeeAccess?.rolesSecundarios ?? [],
          teamNames: teamNames[employee.idEmpleado] ?? [],
          teamIds: teamIds[employee.idEmpleado] ?? [],
          providerIds: providerEntries.map((entry) => entry.id),
          providerNames: providerEntries.map((entry) => entry.name)
        };
      })
      .filter((row) => {
        if (!this.showHiddenRoles() && row.primaryRole === 'OJT') return false;
        const expectedState = categoryFilter === 'INACTIVO' ? 'INACTIVO' : 'ACTIVO';
        if (row.employee.estadoOperativo !== expectedState) return false;
        if (categoryFilter !== 'TODOS' && categoryFilter !== 'INACTIVO' && row.category !== categoryFilter) return false;
        if (roleFilter && row.primaryRole !== roleFilter) return false;
        if (companyFilter && (row.employee.empresaContratista ?? '').toUpperCase() !== companyFilter) return false;
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

  readonly allActiveRows = computed<PersonalDirectoryRow[]>(() => {
    const access = this.accessByEmployeeId();
    const teamNames = this.teamNamesByEmployeeId();
    const teamIds = this.teamIdsByEmployeeId();
    const providerAssignments = this.providerAssignmentsByScope();

    return this.employees()
      .filter((e) => e.estadoOperativo === 'ACTIVO')
      .map((employee): PersonalDirectoryRow => {
        const employeeAccess = access[employee.idEmpleado] ?? null;
        const legacyPosition = employee.puestoTrabajo && employee.puestoTrabajo !== 'SIN_CONTRATO'
          ? employee.puestoTrabajo
          : null;
        const primaryRole = employeeAccess?.rolPrincipal || legacyPosition || 'SIN_ROL';
        const category = employee.categoriaPersonal
          ?? (legacyPosition ? this.inferCategory(legacyPosition) : 'SIN_CATEGORIA');
        const assignedRoles = [primaryRole, ...(employeeAccess?.rolesSecundarios ?? [])];
        const providerEntries = assignedRoles
          .filter((role) => Boolean(ambitoProveedorPorRol(role)))
          .flatMap((role) => {
            const scope = ambitoProveedorPorRol(role);
            return scope ? providerAssignments[scope][employee.idEmpleado] ?? [] : [];
          })
          .filter((entry, index, entries) => entries.findIndex((candidate) => candidate.id === entry.id) === index)
          .sort((left, right) => left.name.localeCompare(right.name, 'es'));
        return {
          employee,
          access: employeeAccess,
          category,
          hasContract: Boolean(employee.categoriaPersonal || legacyPosition),
          primaryRole,
          secondaryRoles: employeeAccess?.rolesSecundarios ?? [],
          teamNames: teamNames[employee.idEmpleado] ?? [],
          teamIds: teamIds[employee.idEmpleado] ?? [],
          providerIds: providerEntries.map((entry) => entry.id),
          providerNames: providerEntries.map((entry) => entry.name)
        };
      })
      .sort((left, right) => this.fullName(left).localeCompare(this.fullName(right), 'es'));
  });

  readonly structuralRows = computed(() => this.rows().filter((row) => row.category === 'ESTRUCTURAL'));
  readonly maintenanceRows = computed(() => this.rows().filter((row) => row.category === 'MANTENIMIENTO'));
  readonly unclassifiedRows = computed(() => this.rows().filter((row) => row.category === 'SIN_CATEGORIA'));
  readonly operationalGroups = computed<PersonalRoleGroup[]>(() => {
    const roles = new Map<string, PersonalDirectoryRow[]>();
    for (const row of this.rows().filter((candidate) => candidate.category === 'OPERATIVO')) {
      roles.set(row.primaryRole, [...(roles.get(row.primaryRole) ?? []), row]);
    }
    return [...roles.entries()]
      .map(([role, employees]) => {
        const scopeType = personalScopeTypeForRole(role);
        const usesTeams = scopeType === 'TEAM';
        return {
          role,
          employees,
          scopeType,
          usesTeams,
          teams: usesTeams ? this.groupByTeam(employees) : [],
          providers: scopeType === 'PROVIDER' && this.providerScopeStatus() === 'ready'
            ? this.groupByProvider(employees)
            : []
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
    this.accessDirectoryWarning.set('');
    try {
      const [employees, activeEmployment] = await Promise.all([
        this.loadEmployeeDirectory(),
        firstValueFrom(this.rrhh.listarEmpleadosLight())
      ]);
      this.employees.set(this.mergeEmploymentData(employees, activeEmployment));
      await Promise.all([
        this.loadTeams(),
        this.canReadRoles() ? this.loadRoleDirectory() : Promise.resolve(),
        this.canReadRoles() ? this.loadProviderScopes() : Promise.resolve(),
        this.loadLiveState()
      ]);
      this.startRealtime();
    } catch (error) {
      this.errorMessage.set(formatApiErrorMessage(error as HttpErrorResponse, 'No se pudo cargar el personal.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  async refresh(): Promise<void> {
    await this.initialize();
  }

  ngOnDestroy(): void {
    this.realtimeSubscription.unsubscribe();
  }

  selectEmployee(empleadoId: number): void {
    this.selectedEmployeeId.set(empleadoId);
  }

  closeEmployee(): void {
    this.selectedEmployeeId.set(null);
  }

  presenceStatus(empleadoId: number): PersonalPresenceStatus {
    const connectedUser = this.connectedUserById()[empleadoId];
    if (!connectedUser || connectedUser.status?.toUpperCase() === 'OFFLINE') {
      return 'OFFLINE';
    }

    const attendanceState = this.normalizePresenceStatus(this.attendanceStateById()[empleadoId]);
    if (attendanceState && attendanceState !== 'ONLINE' && attendanceState !== 'OFFLINE') {
      return attendanceState;
    }

    const disponibilidad = this.normalizePresenceStatus(connectedUser.disponibilidad);
    return disponibilidad && disponibilidad !== 'ONLINE' && disponibilidad !== 'OFFLINE' && disponibilidad !== 'DISPONIBLE'
      ? disponibilidad
      : 'ONLINE';
  }

  presenceStatusLabel(empleadoId: number): string {
    const status = this.presenceStatus(empleadoId);
    switch (status) {
      case 'PAUSA_ACTIVA': return 'PAUSA ACTIVA';
      case 'CAPACITACION': return 'CAPACITACIÓN';
      case 'CON_LEADS': return 'CON LEADS';
      case 'GESTIONANDO': return 'GESTIONANDO';
      case 'SIN_GESTIONAR': return 'SIN GESTIONAR';
      default: return status;
    }
  }

  private async loadLiveState(): Promise<void> {
    const employeeIds = this.employees()
      .filter((employee) => employee.estadoOperativo === 'ACTIVO')
      .map((employee) => employee.idEmpleado);

    this.isLoadingLiveState.set(true);
    try {
      if (!employeeIds.length) {
        this.connectedUserById.set({});
        this.attendanceStateById.set({});
        return;
      }

      const [attendance, connected] = await Promise.all([
        firstValueFrom(
          this.rrhh.getEstadosMonitorEmpleados(employeeIds, this.getToday()).pipe(
            catchError(() => of([]))
          )
        ),
        firstValueFrom(
          this.presenceService.listarUsuariosConectados().pipe(
            catchError(() => of([] as ConnectedUserResponse[]))
          )
        )
      ]);

      this.attendanceStateById.set(
        Object.fromEntries(attendance.map((state) => [state.idEmpleado, state.estadoActual ?? null]))
      );
      this.connectedUserById.set(
        Object.fromEntries(connected.map((user) => [user.empleadoId, user]))
      );
    } finally {
      this.isLoadingLiveState.set(false);
    }
  }

  private startRealtime(): void {
    if (this.realtimeStarted) {
      return;
    }

    this.realtimeStarted = true;
    this.realtimeSubscription.add(
      this.attendanceRealtimeService.watchTopic('/topic/asistencia/monitor').subscribe({
        next: (event) => this.applyAttendanceRealtimeEvent(event),
        error: () => undefined
      })
    );
    this.realtimeSubscription.add(
      this.presenceRealtimeService.watchAll().subscribe({
        next: (event) => this.applyPresenceRealtimeEvent(event),
        error: () => undefined
      })
    );
  }

  private applyAttendanceRealtimeEvent(event: AttendanceRealtimeEvent): void {
    if (event.fecha !== this.getToday() || !this.isActiveEmployee(event.idEmpleado)) {
      return;
    }

    this.attendanceStateById.update((current) => ({
      ...current,
      [event.idEmpleado]: event.estadoActual ?? null
    }));
  }

  private applyPresenceRealtimeEvent(event: PresenceRealtimeEvent): void {
    if (!this.isActiveEmployee(event.empleadoId)) {
      return;
    }

    this.connectedUserById.update((current) => {
      if (event.tipo === 'PRESENCE_OFFLINE' || event.tipo === 'PRESENCE_EXPIRED' || !event.online) {
        const next = { ...current };
        delete next[event.empleadoId];
        return next;
      }

      const existing = current[event.empleadoId];
      return {
        ...current,
        [event.empleadoId]: {
          empleadoId: event.empleadoId,
          nombreCompleto: event.nombreCompleto ?? existing?.nombreCompleto ?? '',
          roles: event.roles ?? existing?.roles ?? [],
          status: 'ONLINE',
          disponibilidad: event.disponibilidad ?? existing?.disponibilidad ?? null,
          equipoActivoId: event.equipoActivoId ?? existing?.equipoActivoId ?? null,
          lastSeen: event.lastSeen ?? event.occurredAt ?? existing?.lastSeen ?? null
        }
      };
    });
  }

  private isActiveEmployee(empleadoId: number): boolean {
    return this.employees().some((employee) =>
      employee.idEmpleado === empleadoId && employee.estadoOperativo === 'ACTIVO'
    );
  }

  private normalizePresenceStatus(value: string | null | undefined): PersonalPresenceStatus | null {
    const normalized = value?.trim().toUpperCase();
    if (!normalized || !PERSONAL_PRESENCE_STATUSES.has(normalized)) {
      return null;
    }
    return normalized as PersonalPresenceStatus;
  }

  private getToday(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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
    try {
      const [catalog, users] = await Promise.all([
        firstValueFrom(this.accessService.listRoles()),
        this.loadAllAccessUsers()
      ]);
      this.roleCatalog.set(catalog);
      this.accessByEmployeeId.set(Object.fromEntries(users.map((item) => [item.empleadoId, item])));
    } catch (error) {
      this.roleCatalog.set([]);
      this.accessByEmployeeId.set({});
      this.accessDirectoryWarning.set(
        formatApiErrorMessage(error as HttpErrorResponse, 'No se pudo cargar el detalle de accesos; el directorio laboral sigue disponible.')
      );
    }
  }

  private async loadProviderScopes(): Promise<void> {
    this.providerScopeStatus.set('loading');
    this.providerScopeError.set('');
    try {
      const [providers, backoffice, postventa, preventa] = await Promise.all([
        firstValueFrom(this.teamsService.listarProveedores()),
        firstValueFrom(this.teamsService.listarAsignacionesProveedor('BACKOFFICE')),
        firstValueFrom(this.teamsService.listarAsignacionesProveedor('POSTVENTA')),
        firstValueFrom(this.teamsService.listarAsignacionesProveedor('PREVENTA'))
      ]);
      this.providerAssignmentsByScope.set({
        BACKOFFICE: resolveProviderAssignments(providers, backoffice),
        POSTVENTA: resolveProviderAssignments(providers, postventa),
        PREVENTA: resolveProviderAssignments(providers, preventa)
      });
      this.activeProviders.set(providers.filter((provider) => provider.activo !== false));
      this.providerScopeStatus.set('ready');
    } catch {
      this.providerAssignmentsByScope.set({ BACKOFFICE: {}, POSTVENTA: {}, PREVENTA: {} });
      this.activeProviders.set([]);
      this.providerScopeStatus.set('error');
      this.providerScopeError.set('No se pudo cargar el ámbito por proveedor. Intenta actualizar.');
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

  private groupByTeam(employees: PersonalDirectoryRow[]): PersonalTeamGroup[] {
    return groupPersonalRowsByTeam(employees);
  }

  private groupByProvider(employees: PersonalDirectoryRow[]): PersonalProviderGroup[] {
    return groupPersonalRowsByProvider(employees);
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
        estadoOperativo: employee.estadoOperativo === 'INACTIVO' ? 'INACTIVO' : 'ACTIVO',
        empresaContratista: employee.empresaContratista ?? null
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
