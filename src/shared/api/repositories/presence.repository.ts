/**
 * PresenceRepository
 * 
 * Gestiona endpoints de presencia/disponibilidad del gateway:
 * - GET /connected-users (listar conectados, filtrable por role)
 * - GET /connected-users/{empleadoId} (validar si conectado)
 * - POST /online (registrar online)
 * - POST /offline (registrar offline)
 * - POST /heartbeat (renovar keepalive)
 * - PATCH /disponibilidad/{disponibilidad} (cambiar estado)
 */

import { presenceHttp } from '../httpClient';

export interface ConnectedUser {
  empleadoId: number;
  nombreCompleto: string;
  roles: string[];
  status: string;
  disponibilidad: string;
  lastSeen: string;
  puestoTrabajo?: string;
  conectado?: boolean;
}

export interface ConnectedStatus {
  empleadoId: number;
  conectado: boolean;
}

export class PresenceRepository {
  private static readonly baseUrl = '';

  /**
   * GET /presence/connected-users
   * Obtener lista de usuarios conectados
   * @param role - Opcional: filtrar por rol (ej. "ASESOR_VENTAS", "ASESOR_GTR")
   * @returns Lista de usuarios conectados
   */
  static async getConnectedUsers(role?: string): Promise<ConnectedUser[]> {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const url = `${this.baseUrl}/connected-users${query}`;
    
    console.log('[PresenceRepository] GET /connected-users', {
      url,
      role,
    });

    const response = await presenceHttp.get<ConnectedUser[]>(url);
    return response.data;
  }

  /**
   * GET /presence/connected-users/{empleadoId}
   * Validar si un empleado está conectado
   * @param empleadoId - ID del empleado
   * @returns Estado de conexión
   */
  static async isConnected(empleadoId: number): Promise<ConnectedStatus> {
    const url = `${this.baseUrl}/connected-users/${empleadoId}`;
    
    console.log('[PresenceRepository] GET /connected-users/{empleadoId}', {
      url,
      empleadoId,
    });

    const response = await presenceHttp.get<ConnectedStatus>(url);
    return response.data;
  }

  /**
   * POST /presence/online
   * Registrar empleado como online
   */
  static async markOnline(): Promise<void> {
    const url = `${this.baseUrl}/online`;
    
    console.log('[PresenceRepository] POST /online');

    await presenceHttp.post(url);
  }

  /**
   * POST /presence/offline
   * Registrar empleado como offline
   */
  static async markOffline(): Promise<void> {
    const url = `${this.baseUrl}/offline`;
    
    console.log('[PresenceRepository] POST /offline');

    await presenceHttp.post(url);
  }

  /**
   * POST /presence/heartbeat
   * Renovar keepalive
   */
  static async heartbeat(): Promise<void> {
    const url = `${this.baseUrl}/heartbeat`;
    
    console.log('[PresenceRepository] POST /heartbeat');

    await presenceHttp.post(url);
  }

  /**
   * PATCH /presence/disponibilidad/{disponibilidad}
   * Cambiar estado de disponibilidad
   * @param disponibilidad - Estado: DISPONIBLE, GESTIONANDO, OCUPADO, SATURADO
   */
  static async updateDisponibilidad(disponibilidad: string): Promise<void> {
    const url = `${this.baseUrl}/disponibilidad/${disponibilidad}`;
    
    console.log('[PresenceRepository] PATCH /disponibilidad/{disponibilidad}', {
      url,
      disponibilidad,
    });

    await presenceHttp.patch(url);
  }
}
