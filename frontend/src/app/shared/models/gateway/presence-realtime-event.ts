export interface PresenceRealtimeEvent {
  tipo:
    | 'PRESENCE_ONLINE'
    | 'PRESENCE_OFFLINE'
    | 'PRESENCE_DISPONIBILIDAD_ACTUALIZADA'
    | 'PRESENCE_EQUIPO_ACTIVO_ACTUALIZADO'
    | 'PRESENCE_EXPIRED';
  empleadoId: number;
  nombreCompleto?: string | null;
  roles: string[];
  disponibilidad?: string | null;
  equipoActivoId?: number | null;
  lastSeen?: string | null;
  online: boolean;
  source:
    | 'ONLINE_ENDPOINT'
    | 'OFFLINE_ENDPOINT'
    | 'HEARTBEAT_RECOVERY'
    | 'DISPONIBILIDAD_ENDPOINT'
    | 'EQUIPO_ACTIVO_ENDPOINT'
    | 'REDIS_TTL';
  occurredAt?: string | null;
}
