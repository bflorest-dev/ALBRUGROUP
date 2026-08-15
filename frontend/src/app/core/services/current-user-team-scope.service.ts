import { Injectable, inject } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../features/auth/services/auth.service';
import { SessionService } from './session.service';

const TEAM_SCOPED_DASHBOARD_ROLES = new Set([
  'ASESOR_GTR',
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
  private readonly sessionService = inject(SessionService);
  private readonly equipoIdsByEmpleado = new Map<number, Promise<number[]>>();

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

    const equipoIds = await this.getEquipoIds(session.empleadoId);
    return equipoIds[0] ?? null;
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
}
