export interface TramoAsistenciaCalendarioResponse {
  origen:
    | 'BASE'
    | 'AMPLIACION'
    | 'REEMPLAZO_BASE'
    | 'JORNADA_EXTRAORDINARIA'
    | 'TRAMO_ADICIONAL';
  horaEntradaEstablecida: string | null;
  horaSalidaEstablecida: string | null;
  horaEntradaAsistencia: string | null;
  horaSalidaAsistencia: string | null;
  minutosObjetivo: number;
  minutosTrabajados: number;
  motivo: string | null;
  creadoPor: number | null;
}

export interface AsistenciaDiaCalendarioResponse {
  fecha: string;
  laborable: boolean;
  horaEntradaEstablecida: string | null;
  horaEntradaAsistencia: string | null;
  horaSalidaEstablecida: string | null;
  horaSalidaAsistencia: string | null;
  jornadaCerrada: boolean;
  tramos: TramoAsistenciaCalendarioResponse[];
}

export interface AsistenciaMesResponse {
  idEmpleado: number;
  anio: number;
  mes: number;
  dias: AsistenciaDiaCalendarioResponse[];
}
