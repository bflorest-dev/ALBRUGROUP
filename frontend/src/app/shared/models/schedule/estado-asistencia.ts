export type EstadoAsistencia =
  | 'OFFLINE'
  | 'ONLINE'
  | 'ALMUERZO'
  | 'SERVICIOS'
  | 'PAUSA_ACTIVA'
  | 'CAPACITACION';

export type AttendanceActionId =
  | 'REGISTRAR_INGRESO'
  | 'REGISTRAR_SALIDA'
  | 'INICIAR_ALMUERZO'
  | 'FINALIZAR_ALMUERZO'
  | 'INICIAR_SERVICIOS'
  | 'FINALIZAR_SERVICIOS'
  | 'INICIAR_PAUSA_ACTIVA'
  | 'FINALIZAR_PAUSA_ACTIVA'
  | 'FINALIZAR_CAPACITACION';

export type AttendanceStatusMeta = {
  color: string;
  label: string;
};

export type AttendanceActionOption = {
  /** Clave estable para el @for del picker. Los display-only (sin accion) igual la necesitan. */
  key: string;
  /**
   * Accion que dispara al seleccionar. null = opcion display-only (p. ej. CAPACITACION para el asesor,
   * que la activa un rol externo): se muestra en el catalogo pero nunca es clickeable.
   */
  actionId: AttendanceActionId | null;
  targetStatus: EstadoAsistencia;
  label: string;
  /**
   * true = clickeable ahora. Si es false la opcion se muestra igual (mostrar + deshabilitar + motivo),
   * pero no se puede seleccionar. La compuerta es autoritativa del backend; el motivo lo compone el front.
   */
  enabled: boolean;
  /** Copy en lenguaje de usuario del porque esta deshabilitada (solo cuando enabled=false). */
  disabledReason?: string;
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
  PAUSA_ACTIVA: {
    color: '#12b5a5',
    label: 'PAUSA ACTIVA'
  },
  CAPACITACION: {
    color: '#ff9b54',
    label: 'CAPACITACION'
  }
};
