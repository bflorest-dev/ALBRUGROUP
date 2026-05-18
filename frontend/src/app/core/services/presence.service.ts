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

  listarAsesoresConectadosGtr(fecha?: string): import('rxjs').Observable<AsesorGtrPresenceResponse[]> {
    const params = fecha ? new HttpParams().set('fecha', fecha) : undefined;
    return this.http.get<AsesorGtrPresenceResponse[]>(`${this.baseUrl}/monitor/gtr/asesores-ventas/conectados`, {
      params
    });
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
      void firstValueFrom(this.http.post<void>(`${this.baseUrl}/presence/heartbeat`, {})).catch(() => undefined);
    }, this.heartbeatIntervalMs);
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
