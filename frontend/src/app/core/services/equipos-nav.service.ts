import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { API_CONSTANTS } from '../constants/api.constants';

export interface EquipoNavResponse {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

/**
 * Fuente ligera de equipos para construir el submenu de COLABORADORES en el
 * sidebar. Solo lista `/auth/equipos` (sin miembros), asi que es barata y se
 * carga bajo demanda una unica vez. La membresia de cada equipo se resuelve
 * al abrir la categoria, no aqui.
 */
@Injectable({ providedIn: 'root' })
export class EquiposNavService {
  private readonly http = inject(HttpClient);
  private readonly equiposUrl = `${API_CONSTANTS.gatewayBaseUrl}/auth/equipos`;

  private readonly teams = signal<EquipoNavResponse[]>([]);
  private loadStarted = false;

  /** Equipos activos, ordenados por nombre, para el submenu del sidebar. */
  readonly activeTeams = computed(() =>
    this.teams()
      .filter((team) => team.activo)
      .sort((left, right) => left.nombre.localeCompare(right.nombre))
  );

  /** Carga perezosa idempotente: solo dispara la primera vez. */
  ensureLoaded(): void {
    if (this.loadStarted) {
      return;
    }
    this.loadStarted = true;
    this.http
      .get<EquipoNavResponse[]>(this.equiposUrl)
      .pipe(
        tap((teams) => this.teams.set(teams)),
        catchError(() => of<EquipoNavResponse[]>([]))
      )
      .subscribe();
  }

  /** Fuerza una recarga (p. ej. tras crear/editar equipos en Admin). */
  reload(): void {
    this.loadStarted = false;
    this.ensureLoaded();
  }
}
