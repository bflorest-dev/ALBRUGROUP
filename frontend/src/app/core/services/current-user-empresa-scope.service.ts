import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_CONSTANTS } from '../constants/api.constants';
import { STORAGE_KEYS } from '../constants/storage.constants';
import { SessionService } from './session.service';

const EMPRESA_SCOPED_ROLES = new Set(['RRHH']);

export interface MiEmpresaContratista {
  id: number;
  nombre: string;
}

/**
 * Mantiene, para el usuario actual con scope por empresa contratista (RRHH), la lista de
 * empresas asignadas y cuál está activa. La empresa activa se envía en cada request a /rrhh
 * (header X-Empresa-Contratista-Id, ver empresaScopeInterceptor) para que RRHH solo vea datos
 * de su empresa activa. El selector del sidebar solo aparece cuando hay más de una empresa.
 */
@Injectable({ providedIn: 'root' })
export class CurrentUserEmpresaScopeService {
  private readonly http = inject(HttpClient);
  private readonly sessionService = inject(SessionService);

  private readonly empresasState = signal<MiEmpresaContratista[]>([]);
  private readonly activeIdState = signal<number | null>(this.readStoredActiveId());
  private loaded = false;

  readonly empresas = this.empresasState.asReadonly();
  readonly activeId = computed(() => {
    const actual = this.activeIdState();
    if (actual !== null) return actual;
    const empresas = this.empresasState();
    return empresas.length === 1 ? empresas[0].id : null;
  });
  readonly mostrarSelector = computed(() => this.empresasState().length > 1);
  readonly empresaActiva = computed(() => {
    const id = this.activeId();
    return this.empresasState().find((e) => e.id === id) ?? null;
  });

  constructor() {
    effect(() => {
      const id = this.activeId();
      if (id === null) {
        localStorage.removeItem(STORAGE_KEYS.activeEmpresaContratistaId);
        return;
      }
      localStorage.setItem(STORAGE_KEYS.activeEmpresaContratistaId, String(id));
    });
  }

  private isEmpresaScoped(): boolean {
    const role = this.sessionService.getActiveRole();
    return !!role && EMPRESA_SCOPED_ROLES.has(role);
  }

  async load(): Promise<boolean> {
    if (this.loaded || !this.isEmpresaScoped()) {
      return true;
    }
    try {
      const empresas = await firstValueFrom(
        this.http.get<MiEmpresaContratista[]>(
          `${API_CONSTANTS.gatewayBaseUrl}/rrhh/empresas-contratistas/mis-empresas-contratistas`
        )
      );
      this.empresasState.set(empresas ?? []);
      this.normalizarActivo();
      this.loaded = true;
      return true;
    } catch {
      this.empresasState.set([]);
      this.activeIdState.set(null);
      this.loaded = false;
      return false;
    }
  }

  setActive(id: number): void {
    if (this.empresasState().some((e) => e.id === id)) {
      this.activeIdState.set(id);
    }
  }

  clear(): void {
    this.loaded = false;
    this.empresasState.set([]);
    this.activeIdState.set(null);
  }

  resetForOperationalScopeChange(): void {
    this.loaded = false;
    this.empresasState.set([]);
  }

  private normalizarActivo(): void {
    const empresas = this.empresasState();
    if (empresas.length === 0) {
      this.activeIdState.set(null);
      return;
    }
    if (empresas.length === 1) {
      this.activeIdState.set(empresas[0].id);
      return;
    }
    const actual = this.activeIdState();
    if (actual !== null && empresas.some((e) => e.id === actual)) {
      return;
    }
    this.activeIdState.set(empresas[0].id);
  }

  private readStoredActiveId(): number | null {
    const raw = localStorage.getItem(STORAGE_KEYS.activeEmpresaContratistaId);
    if (!raw) {
      return null;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
