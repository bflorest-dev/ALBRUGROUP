import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';

export interface EquipoResponse {
  id: number;
  nombre: string;
  descripcion?: string;
  color?: string | null;
  activo: boolean;
}

export interface EquipoMiembroResponse {
  empleadoId: number;
  nombreCompleto: string;
  roles: string[];
}

export interface ProveedorLite {
  id: number;
  nombre: string;
  activo?: boolean;
  fallbackLeadSinCampana?: boolean;
}

export interface EmpleadoLite {
  idEmpleado: number;
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
  puestoTrabajo: string;
}

export type AmbitoProveedor = 'BACKOFFICE' | 'POSTVENTA';

export interface AsignacionUsuarioProveedor {
  idEmpleado: number;
  proveedorIds: number[];
}

@Injectable({ providedIn: 'root' })
export class AdminEquipoService {
  private readonly http = inject(HttpClient);
  private readonly authEquiposUrl = `${API_CONSTANTS.gatewayBaseUrl}/auth/equipos`;
  private readonly leadEquiposUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads/equipos`;
  private readonly proveedoresUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads/proveedores`;
  private readonly postventaAsesoresUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads/postventa/asesores`;
  private readonly backfillUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads/equipos-backfill`;
  private readonly empleadosLightUrl = `${API_CONSTANTS.gatewayBaseUrl}/rrhh/empleados/light`;

  // --- Equipos (auth) ---
  listarEquipos(): Observable<EquipoResponse[]> {
    return this.http.get<EquipoResponse[]>(this.authEquiposUrl);
  }

  listarMisEquipos(): Observable<EquipoResponse[]> {
    return this.http.get<EquipoResponse[]>(`${this.authEquiposUrl}/mis-equipos`);
  }

  crearEquipo(nombre: string, descripcion?: string, color?: string | null): Observable<EquipoResponse> {
    return this.http.post<EquipoResponse>(this.authEquiposUrl, { nombre, descripcion, color });
  }

  actualizarEquipo(
    id: number,
    body: { nombre?: string; descripcion?: string; color?: string | null; activo?: boolean }
  ): Observable<EquipoResponse> {
    return this.http.patch<EquipoResponse>(`${this.authEquiposUrl}/${id}`, body);
  }

  listarMiembros(idEquipo: number): Observable<EquipoMiembroResponse[]> {
    return this.http.get<EquipoMiembroResponse[]>(`${this.authEquiposUrl}/${idEquipo}/usuarios`);
  }

  // Elimina el equipo en auth (y desvincula a sus miembros).
  eliminarEquipoAuth(id: number): Observable<unknown> {
    return this.http.delete(`${this.authEquiposUrl}/${id}`);
  }

  // Limpia en lead las asignaciones de proveedores y desvincula los leads del equipo.
  limpiarDatosLeadEquipo(id: number): Observable<unknown> {
    return this.http.delete(`${this.leadEquiposUrl}/${id}`);
  }

  // Reemplaza los equipos del empleado (mover = pasar nuevo id; quitar = arreglo vacío).
  asignarEquiposAEmpleado(empleadoId: number, equipoIds: number[]): Observable<unknown> {
    return this.http.put(`${this.authEquiposUrl}/usuarios/${empleadoId}`, { equipoIds });
  }

  // --- Proveedores del equipo (lead) ---
  listarProveedores(): Observable<ProveedorLite[]> {
    const params = new HttpParams().set('activo', true);
    return this.http.get<ProveedorLite[]>(this.proveedoresUrl, { params });
  }

  listarProveedoresDeEquipo(idEquipo: number): Observable<ProveedorLite[]> {
    return this.http.get<ProveedorLite[]>(`${this.leadEquiposUrl}/${idEquipo}/proveedores`);
  }

  // Reemplaza el set de proveedores del equipo (move/exclusividad la aplica el backend).
  asignarProveedores(
    idEquipo: number,
    proveedorIds: number[],
    idProveedorFallbackLeadSinCampana?: number | null
  ): Observable<ProveedorLite[]> {
    return this.http.put<ProveedorLite[]>(`${this.leadEquiposUrl}/${idEquipo}/proveedores`, {
      proveedorIds,
      idProveedorFallbackLeadSinCampana: idProveedorFallbackLeadSinCampana ?? null
    });
  }

  listarProveedoresPostventaAsesor(empleadoId: number): Observable<ProveedorLite[]> {
    return this.http.get<ProveedorLite[]>(`${this.postventaAsesoresUrl}/${empleadoId}/proveedores`);
  }

  asignarProveedoresPostventaAsesor(empleadoId: number, proveedorIds: number[]): Observable<ProveedorLite[]> {
    return this.http.put<ProveedorLite[]>(`${this.postventaAsesoresUrl}/${empleadoId}/proveedores`, { proveedorIds });
  }

  // --- Scope por proveedor unificado (BACKOFFICE / POSTVENTA) ---
  private readonly usuariosProveedoresUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads/usuarios`;

  // Todas las asignaciones del ámbito, agrupadas por empleado (para el grid).
  listarAsignacionesProveedor(ambito: AmbitoProveedor): Observable<AsignacionUsuarioProveedor[]> {
    const params = new HttpParams().set('ambito', ambito);
    return this.http.get<AsignacionUsuarioProveedor[]>(`${this.usuariosProveedoresUrl}/proveedores`, { params });
  }

  // Reemplaza el set de proveedores del empleado en el ámbito dado.
  asignarProveedoresUsuario(
    empleadoId: number,
    ambito: AmbitoProveedor,
    proveedorIds: number[]
  ): Observable<ProveedorLite[]> {
    const params = new HttpParams().set('ambito', ambito);
    return this.http.put<ProveedorLite[]>(
      `${this.usuariosProveedoresUrl}/${empleadoId}/proveedores`,
      { proveedorIds },
      { params }
    );
  }

  backfillLeads(): Observable<{ leadsActualizados: number }> {
    return this.http.post<{ leadsActualizados: number }>(this.backfillUrl, {});
  }

  // --- Empleados (rrhh) para elegir a quién asignar ---
  listarEmpleados(): Observable<EmpleadoLite[]> {
    return this.http.get<EmpleadoLite[]>(this.empleadosLightUrl);
  }
}
