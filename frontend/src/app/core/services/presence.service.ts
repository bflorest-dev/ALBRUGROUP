import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable, effect, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_CONSTANTS } from '../constants/api.constants';
import { SessionService } from './session.service';
import { TokenService } from './token.service';

export interface AsesorGtrPresenceResponse {
  empleadoId: number;
  nombreCompleto: string;
  disponibilidad?: string | null;
  lastSeen?: string | null;
  estadoSchedule?: string | null;
  desde?: string | null;
  esperadoHoy: boolean;
  operativo: boolean;
}

export interface AsesorSupervisorResponse {
  empleadoId: number;
  nombreCompleto: string;
  roles?: string[] | null;
  disponibilidad?: string | null;
  disponibilidadDesde?: string | null;
  lastSeen?: string | null;
  estadoSchedule?: string | null;
  desde?: string | null;
  entradaProgramada?: string | null;
  esperadoHoy: boolean;
  tieneRegistroHoy?: boolean;
  operativo: boolean;
  minutosServiciosEnCurso?: number | null;
  minutosServiciosAcumulados?: number | null;
  minutosServiciosPermitidos?: number | null;
  excedioServicios?: boolean | null;
}

export interface EmpleadoEsperadoResponse {
  empleadoId: number;
  nombreCompleto: string;
  roles?: string[] | null;
  fecha?: string | null;
  entradaProgramada?: string | null;
  conectado: boolean;
  tieneHorarioVigente?: boolean;
  laborableHoy?: boolean;
  esperadoHoy: boolean;
  tieneRegistroHoy?: boolean;
  estadoSchedule?: string | null;
}

export interface ConnectedUserResponse {
  empleadoId: number;
  nombreCompleto: string;
  roles: string[];
  status?: string | null;
  disponibilidad?: string | null;
  lastSeen?: string | null;
}

export interface ConnectedStatusResponse {
  empleadoId: number;
  conectado: boolean;
}

export type DisponibilidadOperativa =
  | 'DISPONIBLE'
  | 'CON_LEADS'
  | 'GESTIONANDO'
  | 'SIN_GESTIONAR'
  | 'OCUPADO'
  | 'SATURADO';

@Injectable({ providedIn: 'root' })
export class PresenceService {
  private readonly http = inject(HttpClient);
  private readonly sessionService = inject(SessionService);
  private readonly tokenService = inject(TokenService);
  private readonly baseUrl = API_CONSTANTS.gatewayBaseUrl;
  private readonly heartbeatIntervalMs = 30000;
  private heartbeatId: number | null = null;
  private online = false;

  constructor(@Inject(DOCUMENT) private readonly document: Document) {
    effect(() => {
      const session = this.sessionService.session();
      const token = this.tokenService.getAccessToken();

      if (session && token) {
        return;
      }

      this.stopHeartbeat();
      this.online = false;
    });

    if (this.isBrowser()) {
      window.addEventListener('pagehide', () => {
        if (this.online) {
          this.sendOfflineKeepalive();
        }
      });
    }
  }

  async start(): Promise<void> {
    if (this.online) {
      return;
    }

    try {
      await firstValueFrom(this.http.post<void>(`${this.baseUrl}/presence/online`, {}));
      this.online = true;
      this.startHeartbeat();
    } catch {
      this.online = false;
    }
  }

  async offline(): Promise<void> {
    this.stopHeartbeat();

    if (!this.tokenService.getAccessToken()) {
      this.online = false;
      return;
    }

    try {
      await firstValueFrom(this.http.post<void>(`${this.baseUrl}/presence/offline`, {}));
    } catch {
      this.sendOfflineKeepalive();
    } finally {
      this.online = false;
    }
  }

  async actualizarDisponibilidad(disponibilidad: DisponibilidadOperativa): Promise<void> {
    await firstValueFrom(this.http.patch<void>(`${this.baseUrl}/presence/disponibilidad/${disponibilidad}`, {}));
  }

  listarAsesoresConectadosGtr(fecha?: string): import('rxjs').Observable<AsesorGtrPresenceResponse[]> {
    const params = fecha ? new HttpParams().set('fecha', fecha) : undefined;
    return this.http.get<AsesorGtrPresenceResponse[]>(`${this.baseUrl}/monitor/gtr/asesores-ventas/conectados`, {
      params
    });
  }

  listarAsesoresSupervisor(fecha?: string): import('rxjs').Observable<AsesorSupervisorResponse[]> {
    const params = fecha ? new HttpParams().set('fecha', fecha) : undefined;
    return this.http.get<AsesorSupervisorResponse[]>(
      `${this.baseUrl}/monitor/supervisor-ventas/asesores-ventas/conectados`,
      { params }
    );
  }

  listarEsperadosNoConectados(fecha?: string): import('rxjs').Observable<EmpleadoEsperadoResponse[]> {
    const params = fecha ? new HttpParams().set('fecha', fecha) : undefined;
    return this.http.get<EmpleadoEsperadoResponse[]>(
      `${this.baseUrl}/monitor/supervisor-ventas/asesores-ventas/esperados-no-conectados`,
      { params }
    );
  }

  listarUsuariosConectados(role?: string): import('rxjs').Observable<ConnectedUserResponse[]> {
    const params = role ? new HttpParams().set('role', role) : undefined;
    return this.http.get<ConnectedUserResponse[]>(`${this.baseUrl}/presence/connected-users`, {
      params
    });
  }

  estaConectado(empleadoId: number): import('rxjs').Observable<ConnectedStatusResponse> {
    return this.http.get<ConnectedStatusResponse>(`${this.baseUrl}/presence/connected-users/${empleadoId}`);
  }

  private startHeartbeat(): void {
    if (!this.isBrowser() || this.heartbeatId !== null) {
      return;
    }

    this.heartbeatId = window.setInterval(() => {
      void this.sendHeartbeat();
    }, this.heartbeatIntervalMs);
  }

  /**
   * Heartbeat con auto-reencendido. Si el heartbeat falla (la presencia del gateway pudo expirar por un
   * corte/Cloudflare), re-registramos con /presence/online en vez de quedar "apagados sin re-encender":
   * asi el empleado no desaparece del monitoreo de GTR/Supervisor hasta el proximo F5.
   */
  private async sendHeartbeat(): Promise<void> {
    try {
      await firstValueFrom(this.http.post<void>(`${this.baseUrl}/presence/heartbeat`, {}));
      this.online = true;
    } catch {
      this.online = false;
      try {
        await firstValueFrom(this.http.post<void>(`${this.baseUrl}/presence/online`, {}));
        this.online = true;
      } catch {
        this.online = false;
      }
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatId !== null) {
      window.clearInterval(this.heartbeatId);
      this.heartbeatId = null;
    }
  }

  private sendOfflineKeepalive(): void {
    const token = this.tokenService.getAccessToken();
    const windowRef = this.document.defaultView;

    if (!token || !windowRef?.fetch) {
      return;
    }

    void windowRef.fetch(`${this.baseUrl}/presence/offline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      keepalive: true
    });
  }

  private isBrowser(): boolean {
    return !!this.document.defaultView;
  }
}
