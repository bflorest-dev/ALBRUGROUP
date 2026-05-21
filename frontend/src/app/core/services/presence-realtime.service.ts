import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../constants/api.constants';
import { PresenceRealtimeEvent } from '../../shared/models/gateway/presence-realtime-event';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class PresenceRealtimeService {
  private readonly tokenService = inject(TokenService);

  watchAll(): Observable<PresenceRealtimeEvent> {
    return new Observable<PresenceRealtimeEvent>((subscriber) => {
      let socket: WebSocket | null = null;
      let reconnectTimer: number | null = null;
      let closed = false;

      const clearReconnect = (): void => {
        if (reconnectTimer !== null) {
          window.clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
      };

      const scheduleReconnect = (): void => {
        if (closed || reconnectTimer !== null) {
          return;
        }

        reconnectTimer = window.setTimeout(() => {
          reconnectTimer = null;
          connect();
        }, 5000);
      };

      const connect = (): void => {
        const token = this.tokenService.getAccessToken();

        if (!token) {
          subscriber.error(new Error('Token de acceso no disponible para realtime de presencia.'));
          return;
        }

        socket = new WebSocket(`${this.wsBaseUrl()}/presence/ws?access_token=${encodeURIComponent(token)}`);

        socket.onmessage = (event) => {
          try {
            subscriber.next(JSON.parse(String(event.data)) as PresenceRealtimeEvent);
          } catch (error) {
            subscriber.error(error);
          }
        };

        socket.onerror = () => {
          console.warn('No se pudo conectar el realtime de presencia. Reintentando...');
        };

        socket.onclose = () => {
          socket = null;
          if (!closed) {
            scheduleReconnect();
          }
        };
      };

      connect();

      return () => {
        closed = true;
        clearReconnect();
        socket?.close();
      };
    });
  }

  private wsBaseUrl(): string {
    return API_CONSTANTS.gatewayBaseUrl.replace(/^http/i, 'ws');
  }
}
