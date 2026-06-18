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
      let subscription: StompSubscription | null = null;
      const client = new Client({
        brokerURL: `${this.wsBaseUrl()}/leads/ws/leads`,
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
            subscriber.next(JSON.parse(message.body) as LeadRealtimeEvent);
          } catch (error) {
            subscriber.error(error);
          }
        });
      };

      // No terminamos el Observable ante cortes transitorios: stompjs reconecta solo
      // (reconnectDelay) y onConnect vuelve a suscribir. Antes un solo error mataba el
      // feed hasta recargar la pagina.
      client.onStompError = (frame) => {
        console.warn(frame.headers['message'] ?? 'Error STOMP en realtime de leads. Reintentando...');
      };

      client.onWebSocketError = () => {
        console.warn('No se pudo conectar el realtime de leads. Reintentando...');
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
