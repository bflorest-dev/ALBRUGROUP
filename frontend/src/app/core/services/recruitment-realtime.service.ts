import { Injectable, inject } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../constants/api.constants';
import { TokenService } from './token.service';
import { PostulacionRealtimeEvent } from '../../shared/models/recruitment/postulacion-realtime-event';

@Injectable({ providedIn: 'root' })
export class RecruitmentRealtimeService {
  private readonly tokenService = inject(TokenService);

  watchTopic(topic: string): Observable<PostulacionRealtimeEvent> {
    return new Observable<PostulacionRealtimeEvent>((subscriber) => {
      let subscription: StompSubscription | null = null;
      const client = new Client({
        brokerURL: `${this.wsBaseUrl()}/recruitment/ws/postulaciones`,
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
            subscriber.next(JSON.parse(message.body) as PostulacionRealtimeEvent);
          } catch (error) {
            subscriber.error(error);
          }
        });
      };

      // No terminamos el Observable ante cortes transitorios: stompjs reconecta solo
      // (reconnectDelay) y onConnect vuelve a suscribir.
      client.onStompError = (frame) => {
        console.warn(frame.headers['message'] ?? 'Error STOMP en realtime de postulaciones. Reintentando...');
      };

      client.onWebSocketError = () => {
        console.warn('No se pudo conectar el realtime de postulaciones. Reintentando...');
      };

      client.activate();

      return () => {
        subscription?.unsubscribe();
        void client.deactivate();
      };
    });
  }

  private wsBaseUrl(): string {
    return API_CONSTANTS.gatewayBaseUrl.replace(/^http/i, 'ws');
  }
}
