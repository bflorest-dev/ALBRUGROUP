export interface CumplimientoResumenResponse {
  desde: string;
  hasta: string;
  empleados: Array<{
    idEmpleado: number;
    [key: string]: unknown;
  }>;
}

export interface CumplimientoDetalleResponse {
  desde: string;
  hasta: string;
  empleados: Array<{
    idEmpleado: number;
    dias?: unknown[];
    [key: string]: unknown;
  }>;
}

export interface EstadoMonitorResponse {
  idEmpleado: number;
  fecha: string;
  idHorario?: number | null;
  tieneHorarioVigente: boolean;
  laborableHoy: boolean;
  esperadoHoy: boolean;
  tieneRegistroHoy: boolean;
  estadoActual?: string | null;
  operativo: boolean;
  [key: string]: unknown;
}
