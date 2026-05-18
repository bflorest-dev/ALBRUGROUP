import { Injectable, inject } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { TokenService } from '../../../core/services/token.service';
import { LeadRealtimeEvent } from '../../../shared/models/preventa/preventa.models';

@Injectable({ providedIn: 'root' })
export class LeadRealtimeService {
  private readonly tokenService = inject(TokenService);

  watchTopic(topic: string): Observable<LeadRealtimeEvent> {
    return new Observable<LeadRealtimeEvent>((subscriber) => {
      const token = this.tokenService.getAccessToken();

      if (!token) {
        subscriber.error(new Error('Token de acceso no disponible para realtime.'));
        return undefined;
      }

      let subscription: StompSubscription | null = null;
      const client = new Client({
        brokerURL: `${this.wsBaseUrl()}/leads/ws/leads`,
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
            subscriber.next(JSON.parse(message.body) as LeadRealtimeEvent);
          } catch (error) {
            subscriber.error(error);
          }
        });
      };

      client.onStompError = (frame) => {
        subscriber.error(new Error(frame.headers['message'] ?? 'Error STOMP en realtime.'));
      };

      client.onWebSocketError = () => {
        subscriber.error(new Error('No se pudo conectar el realtime de leads.'));
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
