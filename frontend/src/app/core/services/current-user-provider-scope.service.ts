import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_CONSTANTS } from '../constants/api.constants';
import { STORAGE_KEYS } from '../constants/storage.constants';
import { SessionService } from './session.service';

/** Roles cuya bandeja se acota por proveedor (no por equipo). */
const PROVIDER_SCOPED_ROLES = new Set([
  'ASESOR_BACKOFFICE',
  'SUPERVISOR_BACKOFFICE',
  'ASESOR_POSTVENTA',
  'SUPERVISOR_POSTVENTA'
]);

export interface MiProveedor {
  id: number;
  nombre: string;
}

/**
 * Mantiene, para el usuario actual acotado por proveedor (BACKOFFICE / POSTVENTA), la lista de
 * proveedores asignados y cuál está activo. El proveedor activo se envía en cada request a /leads
 * (header X-Proveedor-Id, ver proveedorScopeInterceptor) para que backoffice/postventa nunca mezclen
 * bandejas. El selector del sidebar solo aparece cuando hay más de un proveedor.
 */
@Injectable({ providedIn: 'root' })
export class CurrentUserProviderScopeService {
  private readonly http = inject(HttpClient);
  private readonly sessionService = inject(SessionService);

  private readonly proveedoresState = signal<MiProveedor[]>([]);
  private readonly activeIdState = signal<number | null>(this.readStoredActiveId());
  private loaded = false;

  readonly proveedores = this.proveedoresState.asReadonly();
  readonly activeId = this.activeIdState.asReadonly();
  /** El selector solo tiene sentido cuando el usuario atiende más de un proveedor. */
  readonly mostrarSelector = computed(() => this.proveedoresState().length > 1);
  readonly proveedorActivo = computed(() => {
    const id = this.activeIdState();
    return this.proveedoresState().find((proveedor) => proveedor.id === id) ?? null;
  });

  constructor() {
    // Persistir el proveedor activo por navegador.
    effect(() => {
      const id = this.activeIdState();
      if (id === null) {
        localStorage.removeItem(STORAGE_KEYS.activeProveedorId);
        return;
      }
      localStorage.setItem(STORAGE_KEYS.activeProveedorId, String(id));
    });
  }

  private isProviderScoped(): boolean {
    const role = this.sessionService.getPrimaryRole();
    return !!role && PROVIDER_SCOPED_ROLES.has(role);
  }

  /** Carga (una vez) los proveedores del usuario y fija un proveedor activo válido. */
  async load(): Promise<void> {
    if (this.loaded || !this.isProviderScoped()) {
      return;
    }
    this.loaded = true;
    try {
      const proveedores = await firstValueFrom(
        this.http.get<MiProveedor[]>(`${API_CONSTANTS.gatewayBaseUrl}/leads/usuarios/mis-proveedores`)
      );
      this.proveedoresState.set(proveedores ?? []);
      this.normalizarActivo();
    } catch {
      this.proveedoresState.set([]);
    }
  }

  setActive(id: number): void {
    if (this.proveedoresState().some((proveedor) => proveedor.id === id)) {
      this.activeIdState.set(id);
    }
  }

  clear(): void {
    this.loaded = false;
    this.proveedoresState.set([]);
    this.activeIdState.set(null);
  }

  /** Si el activo guardado ya no está entre los asignados, cae al primero disponible. */
  private normalizarActivo(): void {
    const proveedores = this.proveedoresState();
    if (proveedores.length === 0) {
      this.activeIdState.set(null);
      return;
    }
    const actual = this.activeIdState();
    if (actual !== null && proveedores.some((proveedor) => proveedor.id === actual)) {
      return;
    }
    this.activeIdState.set(proveedores[0].id);
  }

  private readStoredActiveId(): number | null {
    const raw = localStorage.getItem(STORAGE_KEYS.activeProveedorId);
    if (!raw) {
      return null;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
