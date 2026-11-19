import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { STORAGE_KEYS } from '../constants/storage.constants';
import { SessionService } from './session.service';

export type RecruitmentNegocio = 'WIN' | 'CLARO';

export interface MiRecruitmentNegocio {
  id: RecruitmentNegocio;
  nombre: string;
}

const RECRUITMENT_ROLES = new Set([
  'SUPERVISOR_RECLUTAMIENTO',
  'RECLUTADOR',
  'CAPACITADOR'
]);

/**
 * Mantiene el negocio activo del dominio Reclutamiento. El contexto es siempre excluyente:
 * no existe una opción agregada para WIN y CLARO.
 */
@Injectable({ providedIn: 'root' })
export class CurrentUserRecruitmentNegocioScopeService {
  private readonly sessionService = inject(SessionService);
  private readonly negociosState = signal<MiRecruitmentNegocio[]>([
    { id: 'WIN', nombre: 'WIN' },
    { id: 'CLARO', nombre: 'Claro' }
  ]);
  private readonly activeState = signal<RecruitmentNegocio>(this.readStoredActive());

  readonly negocios = this.negociosState.asReadonly();
  readonly active = this.activeState.asReadonly();
  readonly negocioActivo = computed(() => this.negociosState().find((negocio) => negocio.id === this.active()) ?? null);
  readonly esRolReclutamiento = computed(() => RECRUITMENT_ROLES.has(this.sessionService.getActiveRole() ?? ''));
  readonly mostrarSelector = computed(() => this.esRolReclutamiento());

  constructor() {
    effect(() => {
      localStorage.setItem(STORAGE_KEYS.activeRecruitmentNegocio, this.active());
    });
  }

  setActive(negocio: RecruitmentNegocio): void {
    if (this.negociosState().some((option) => option.id === negocio)) {
      this.activeState.set(negocio);
    }
  }

  clear(): void {
    this.activeState.set('WIN');
    localStorage.removeItem(STORAGE_KEYS.activeRecruitmentNegocio);
  }

  private readStoredActive(): RecruitmentNegocio {
    const raw = localStorage.getItem(STORAGE_KEYS.activeRecruitmentNegocio);
    return raw === 'CLARO' ? 'CLARO' : 'WIN';
  }
}
