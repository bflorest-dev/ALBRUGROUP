import { computed, effect, Injectable, inject, signal } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../features/auth/services/auth.service';
import { esRolDeEquipo } from '../../shared/constants/multi-team-roles';
import { STORAGE_KEYS } from '../constants/storage.constants';
import { PresenceService } from './presence.service';
import { SessionService } from './session.service';

const TEAM_SCOPED_DASHBOARD_ROLES = new Set([
  'ASESOR_GTR',
  'FREELANCE',
  'SUPERVISOR_GTR',
  'ASESOR_BACKOFFICE',
  'SUPERVISOR_BACKOFFICE',
  'SUPERVISOR_VENTAS',
  'ASESOR_POSTVENTA',
  'SUPERVISOR_POSTVENTA'
]);

@Injectable({
  providedIn: 'root'
})
export class CurrentUserTeamScopeService {
  private readonly authService = inject(AuthService);
  private readonly presenceService = inject(PresenceService);
  private readonly sessionService = inject(SessionService);
  private readonly equipoIdsByEmpleado = new Map<number, Promise<number[]>>();
  private readonly equiposState = signal<EquipoScopeOption[]>([]);
  private readonly activeIdState = signal<number | null>(this.readStoredActiveId());
  private loadedForEmpleadoId: number | null = null;

  readonly equipos = this.equiposState.asReadonly();
  readonly activeId = this.activeIdState.asReadonly();
  readonly mostrarSelector = computed(() => this.equiposState().length > 1);
  readonly equipoActivo = computed(() => {
    const id = this.activeIdState();
    return this.equiposState().find((equipo) => equipo.id === id) ?? null;
  });

  constructor() {
    effect(() => {
      const id = this.activeIdState();
      if (id === null) {
        localStorage.removeItem(STORAGE_KEYS.activeEquipoId);
        return;
      }
      localStorage.setItem(STORAGE_KEYS.activeEquipoId, String(id));
      void this.syncPresenceEquipoActivo(id);
    });
  }

  isTeamScoped(): boolean {
    return esRolDeEquipo(this.sessionService.getActiveRole());
  }

  isDashboardTeamScoped(): boolean {
    const role = this.sessionService.getPrimaryRole();
    return !!role && TEAM_SCOPED_DASHBOARD_ROLES.has(role);
  }

  async getPrimaryEquipoId(): Promise<number | null> {
    if (!this.isDashboardTeamScoped()) {
      return null;
    }

    const session = this.sessionService.getSession();
    if (!session?.empleadoId) {
      return null;
    }

    const equipoIds = this.sessionEquipoIds();
    const resolvedIds = equipoIds.length ? equipoIds : await this.getEquipoIds(session.empleadoId);
    const activeId = this.activeIdState();
    if (activeId !== null && resolvedIds.includes(activeId)) {
      return activeId;
    }
    return resolvedIds[0] ?? null;
  }

  async load(): Promise<void> {
    const session = this.sessionService.getSession();
    if (!session?.empleadoId || !this.isTeamScoped()) {
      this.loadedForEmpleadoId = null;
      this.equiposState.set([]);
      return;
    }
    if (this.loadedForEmpleadoId === session.empleadoId) {
      const activeId = this.activeIdState();
      if (activeId !== null) {
        void this.syncPresenceEquipoActivo(activeId);
      }
      if (this.hasFallbackNames()) {
        void this.refreshEquipoNames();
      }
      return;
    }
    this.loadedForEmpleadoId = session.empleadoId;
    const equiposSesion = this.equiposFromIds(this.sessionEquipoIds());
    if (equiposSesion.length) {
      this.equiposState.set(equiposSesion);
      this.normalizarActivo();
    }
    try {
      const equipos = await firstValueFrom(this.authService.getMisEquipos());
      this.equiposState.set(equipos?.length ? equipos : equiposSesion);
      this.normalizarActivo();
    } catch {
      const ids = equiposSesion.length ? equiposSesion.map((equipo) => equipo.id) : await this.getEquipoIds(session.empleadoId);
      this.equiposState.set(this.equiposFromIds(ids));
      this.normalizarActivo();
    }
  }

  setActive(id: number): void {
    if (this.equiposState().some((equipo) => equipo.id === id)) {
      this.activeIdState.set(id);
    }
  }

  clear(): void {
    this.loadedForEmpleadoId = null;
    this.equiposState.set([]);
    this.activeIdState.set(null);
  }

  resetForOperationalScopeChange(): void {
    this.loadedForEmpleadoId = null;
    this.equiposState.set([]);
  }

  private getEquipoIds(empleadoId: number): Promise<number[]> {
    const cached = this.equipoIdsByEmpleado.get(empleadoId);
    if (cached) {
      return cached;
    }

    const request = firstValueFrom(
      this.authService.getMisEquipos().pipe(
        map((equipos) => equipos.map((equipo) => equipo.id)),
        catchError(() =>
          this.authService.getUsuarioPorEmpleadoId(empleadoId).pipe(
            map((usuario) => usuario.equipoIds ?? []),
            catchError(() => of([]))
          )
        )
      )
    );
    this.equipoIdsByEmpleado.set(empleadoId, request);
    return request;
  }

  private sessionEquipoIds(): number[] {
    return this.sessionService.getSession()?.equipos ?? [];
  }

  private equiposFromIds(ids: number[]): EquipoScopeOption[] {
    return [...new Set(ids)]
      .filter((id) => Number.isInteger(id) && id > 0)
      .map((id) => ({ id, nombre: `Equipo ${id}` }));
  }

  private hasFallbackNames(): boolean {
    return this.equiposState().some((equipo) => equipo.nombre === `Equipo ${equipo.id}`);
  }

  private async refreshEquipoNames(): Promise<void> {
    try {
      const equipos = await firstValueFrom(this.authService.getMisEquipos());
      if (equipos?.length) {
        this.equiposState.set(this.mergeEquipoNames(this.equiposState(), equipos));
        this.normalizarActivo();
      }
    } catch {
      // Si el endpoint no esta disponible para el rol, conservamos el fallback por ID.
    }
  }

  private mergeEquipoNames(current: EquipoScopeOption[], incoming: EquipoScopeOption[]): EquipoScopeOption[] {
    const namesById = new Map(incoming.map((equipo) => [equipo.id, equipo.nombre]));
    return current.map((equipo) => ({
      ...equipo,
      nombre: namesById.get(equipo.id) ?? equipo.nombre
    }));
  }

  private normalizarActivo(): void {
    const equipos = this.equiposState();
    if (equipos.length === 0) {
      this.activeIdState.set(null);
      return;
    }
    const actual = this.activeIdState();
    if (actual !== null && equipos.some((equipo) => equipo.id === actual)) {
      void this.syncPresenceEquipoActivo(actual);
      return;
    }
    this.activeIdState.set(equipos[0].id);
  }

  private async syncPresenceEquipoActivo(id: number): Promise<void> {
    try {
      await this.presenceService.actualizarEquipoActivo(id);
    } catch {
      // La presencia puede no estar inicializada todavia; el siguiente cambio/normalizacion reintentara.
    }
  }

  private readStoredActiveId(): number | null {
    const raw = localStorage.getItem(STORAGE_KEYS.activeEquipoId);
    if (!raw) {
      return null;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
}

export type EquipoScopeOption = {
  id: number;
  nombre: string;
};
