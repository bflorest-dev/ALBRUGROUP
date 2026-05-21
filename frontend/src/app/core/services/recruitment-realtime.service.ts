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
      const token = this.tokenService.getAccessToken();

      if (!token) {
        subscriber.error(new Error('Token de acceso no disponible para realtime.'));
        return undefined;
      }

      let subscription: StompSubscription | null = null;
      const client = new Client({
        brokerURL: `${this.wsBaseUrl()}/recruitment/ws/postulaciones`,
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 20000,
        heartbeatOutgoing: 20000,
        debug: () => undefined
      });

      client.onConnect = () => {
        subscription = client.subscribe(topic, (message: IMessage) => {
          try {
            subscriber.next(JSON.parse(message.body) as PostulacionRealtimeEvent);
          } catch (error) {
            subscriber.error(error);
          }
        });
      };

      client.onStompError = (frame) => {
        subscriber.error(new Error(frame.headers['message'] ?? 'Error STOMP en realtime.'));
      };

      client.onWebSocketError = () => {
        subscriber.error(new Error('No se pudo conectar el realtime de postulaciones.'));
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
