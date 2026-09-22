import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { PageResponse } from '../../../shared/models/common/page-response';

export interface RoleCatalogItem {
  nombre: string;
  descripcion: string;
}

export interface UserAccessSummary {
  empleadoId: number;
  dni: string;
  nombreCompleto: string;
  username: string;
  email: string;
  activo: boolean;
  rolPrincipal: string | null;
  rolesSecundarios: string[];
  rolesAsignados: string[];
}

export interface UserRoles {
  empleadoId: number;
  rolPrincipal: string | null;
  rolesSecundarios: string[];
  rolesAsignados: string[];
}

export interface RoleAuditEntry {
  id: number;
  empleadoId: number;
  actorEmpleadoId: number;
  actorUsername: string;
  rolPrincipalAnterior: string | null;
  rolPrincipalNuevo: string | null;
  rolesAnteriores: string[];
  rolesNuevos: string[];
  fecha: string;
}

@Injectable({ providedIn: 'root' })
export class PersonalAccessService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CONSTANTS.gatewayBaseUrl}${API_CONSTANTS.authBasePath}`;

  listRoles(): Observable<RoleCatalogItem[]> {
    return this.http.get<RoleCatalogItem[]>(`${this.baseUrl}/roles`);
  }

  listUsers(filters: {
    buscar?: string;
    activo?: boolean;
    rol?: string;
    sinRol?: boolean;
    page?: number;
    size?: number;
  } = {}): Observable<PageResponse<UserAccessSummary>> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 250);
    if (filters.buscar) params = params.set('buscar', filters.buscar);
    if (filters.activo !== undefined) params = params.set('activo', filters.activo);
    if (filters.rol) params = params.set('rol', filters.rol);
    if (filters.sinRol !== undefined) params = params.set('sinRol', filters.sinRol);
    return this.http.get<PageResponse<UserAccessSummary>>(`${this.baseUrl}/usuarios`, { params });
  }

  getRoles(empleadoId: number): Observable<UserRoles> {
    return this.http.get<UserRoles>(`${this.baseUrl}/usuarios/${empleadoId}/roles`);
  }

  updateRoles(empleadoId: number, rolPrincipal: string, rolesSecundarios: string[]): Observable<UserRoles> {
    return this.http.put<UserRoles>(`${this.baseUrl}/usuarios/${empleadoId}/roles`, {
      rolPrincipal,
      rolesSecundarios
    });
  }

  getRoleAudit(empleadoId: number, page = 0, size = 25): Observable<PageResponse<RoleAuditEntry>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<RoleAuditEntry>>(
      `${this.baseUrl}/usuarios/${empleadoId}/roles/historial`,
      { params }
    );
  }
}
