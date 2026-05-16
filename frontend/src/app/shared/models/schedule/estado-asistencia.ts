export type EstadoAsistencia =
  | 'OFFLINE'
  | 'ONLINE'
  | 'ALMUERZO'
  | 'SERVICIOS'
  | 'CAPACITACION';

export type AttendanceActionId =
  | 'REGISTRAR_INGRESO'
  | 'REGISTRAR_SALIDA'
  | 'INICIAR_ALMUERZO'
  | 'FINALIZAR_ALMUERZO'
  | 'INICIAR_SERVICIOS'
  | 'FINALIZAR_SERVICIOS';

export type AttendanceStatusMeta = {
  color: string;
  label: string;
};

export type AttendanceActionOption = {
  id: AttendanceActionId;
  targetStatus: EstadoAsistencia;
  label: string;
  helperText: string;
};

export const ATTENDANCE_STATUS_META: Record<EstadoAsistencia, AttendanceStatusMeta> = {
  OFFLINE: {
    color: '#8f96ad',
    label: 'OFFLINE'
  },
  ONLINE: {
    color: '#37c676',
    label: 'ONLINE'
  },
  ALMUERZO: {
    color: '#f3c247',
    label: 'ALMUERZO'
  },
  SERVICIOS: {
    color: '#41b8d5',
    label: 'SERVICIOS'
  },
  CAPACITACION: {
    color: '#ff9b54',
    label: 'CAPACITACION'
  }
};
