export interface AttendanceRealtimeEvent {
  tipo: string;
  origen: string;
  idEmpleado: number;
  fecha: string;
  estadoActual?: string | null;
  estadoAnterior?: string | null;
  desde?: string | null;
  tieneHorarioVigente?: boolean | null;
  laborableHoy?: boolean | null;
  esperadoHoy?: boolean | null;
  operativo?: boolean | null;
  occurredAt?: string | null;
}
