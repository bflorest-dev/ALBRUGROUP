export interface PresenceRealtimeEvent {
  tipo: 'PRESENCE_ONLINE' | 'PRESENCE_OFFLINE' | 'PRESENCE_DISPONIBILIDAD_ACTUALIZADA' | 'PRESENCE_EXPIRED';
  empleadoId: number;
  nombreCompleto?: string | null;
  roles: string[];
  disponibilidad?: string | null;
  lastSeen?: string | null;
  online: boolean;
  source: 'ONLINE_ENDPOINT' | 'OFFLINE_ENDPOINT' | 'HEARTBEAT_RECOVERY' | 'DISPONIBILIDAD_ENDPOINT' | 'REDIS_TTL';
  occurredAt?: string | null;
}
