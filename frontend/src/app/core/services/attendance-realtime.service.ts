import { Injectable, inject } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Observable, map } from 'rxjs';
import { API_CONSTANTS } from '../constants/api.constants';
import { TokenService } from './token.service';
import { AttendanceRealtimeEvent } from '../../shared/models/schedule/attendance-realtime-event';

@Injectable({ providedIn: 'root' })
export class AttendanceRealtimeService {
  private readonly tokenService = inject(TokenService);

  watchTopic(topic: string): Observable<AttendanceRealtimeEvent> {
    return new Observable<AttendanceRealtimeEvent>((subscriber) => {
      let subscription: StompSubscription | null = null;
      const client = new Client({
        brokerURL: `${this.wsBaseUrl()}/schedule/ws/asistencia`,
        reconnectDelay: 5000,
        heartbeatIncoming: 20000,
        heartbeatOutgoing: 20000,
        debug: () => undefined
      });

      // El access token rota; leerlo fresco antes de cada (re)conexion evita que stompjs
      // reenvie un token vencido y el servidor rechace el CONNECT por "JWT expired".
      client.beforeConnect = () => {
        const token = this.tokenService.getAccessToken();
        client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      };

      client.onConnect = () => {
        subscription = client.subscribe(topic, (message: IMessage) => {
          try {
            subscriber.next(JSON.parse(message.body) as AttendanceRealtimeEvent);
          } catch (error) {
            subscriber.error(error);
          }
        });
      };

      client.onStompError = (frame) => {
        console.warn(frame.headers['message'] ?? 'Error STOMP en realtime de asistencia.');
      };

      client.onWebSocketError = () => {
        console.warn('No se pudo conectar el realtime de asistencia. Reintentando...');
      };

      client.activate();

      return () => {
        subscription?.unsubscribe();
        void client.deactivate();
      };
    });
  }

  watchBajaEmpleado(empleadoId: number): Observable<void> {
    return this.watchTopic(`/topic/sesion/baja/${empleadoId}`).pipe(map(() => undefined));
  }

  private wsBaseUrl(): string {
    return API_CONSTANTS.gatewayBaseUrl.replace(/^http/i, 'ws');
  }
}
