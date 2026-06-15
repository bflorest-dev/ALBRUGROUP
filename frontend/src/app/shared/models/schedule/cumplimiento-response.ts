export interface CumplimientoResumenEmpleadoResponse {
  idEmpleado: number;
  diasLaborables: number;
  diasConRegistro: number;
  diasSinRegistro: number;
  diasCerrados: number;
  cantidadTardanzas: number;
  minutosObjetivo: number;
  minutosTrabajados: number;
  minutosBalance: number;
  minutosServiciosAcumulados: number;
  cantidadDiasConExcesoServicios: number;
}

export interface CumplimientoResumenResponse {
  desde: string;
  hasta: string;
  empleados: CumplimientoResumenEmpleadoResponse[];
}

export interface CumplimientoDetalleDiaResponse {
  fecha: string;
  laborable: boolean;
  horaEntradaEstablecida: string | null;
  horaEntradaAsistencia: string | null;
  horaSalidaEstablecida: string | null;
  horaSalidaAsistencia: string | null;
  jornadaCerrada: boolean;
  minutosObjetivoDia: number;
  minutosTrabajados: number;
  minutosBalance: number;
  minutosServiciosAcumulados: number;
  excedioServicios: boolean;
  tardanza: boolean;
  tramos: TramoAsistenciaResponse[];
}

export type OrigenTramo =
  | 'BASE'
  | 'AMPLIACION'
  | 'REEMPLAZO_BASE'
  | 'JORNADA_EXTRAORDINARIA'
  | 'TRAMO_ADICIONAL';

export interface TramoAsistenciaResponse {
  origen: OrigenTramo;
  horaEntradaEstablecida: string | null;
  horaSalidaEstablecida: string | null;
  horaEntradaAsistencia: string | null;
  horaSalidaAsistencia: string | null;
  minutosObjetivo: number;
  minutosTrabajados: number;
  motivo: string | null;
  creadoPor: number | null;
}

export interface CumplimientoDetalleEmpleadoResponse {
  idEmpleado: number;
  dias: CumplimientoDetalleDiaResponse[];
}

export interface CumplimientoDetalleResponse {
  desde: string;
  hasta: string;
  empleados: CumplimientoDetalleEmpleadoResponse[];
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
  entradaProgramada?: string | null;
  [key: string]: unknown;
}
