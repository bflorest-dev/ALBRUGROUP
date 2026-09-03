import { TipoSesionEstado, TramoDiaResponse } from './detalle-dia-response';

/** Tiempo muerto detectado: hueco entre dos tramos de presencia (desconexión y retorno). */
export interface PresenciaGapResponse {
  inicio: string;
  fin: string;
  minutos: number | null;
  motivo: string | null;
  estadoAlDesconectar: string | null;
}

/** Una sesión de sub-estado del día (servicios / pausa activa / capacitación). */
export interface SesionEstadoResponse {
  tipo: TipoSesionEstado;
  inicio: string;
  fin: string | null;
  minutos: number | null;
  creadoPor: number | null;
}

/**
 * Reporte por empleado/día (admin/RRHH): desglose por tramo (re-derivado, cualquier fecha) + sesiones
 * de estado + tiempos muertos de presencia + totales. Sirve al detalle de asistencia del drawer.
 */
export interface ReporteDiaResponse {
  idEmpleado: number;
  fecha: string;
  tieneHorario: boolean | null;
  jornadaCerrada: boolean | null;

  tramos: TramoDiaResponse[] | null;
  sesiones: SesionEstadoResponse[] | null;
  tiemposMuertos: PresenciaGapResponse[] | null;

  almuerzoRealInicio: string | null;
  almuerzoRealFin: string | null;
  minutosAlmuerzoTomados: number | null;

  minutosObjetivoDia: number | null;
  minutosTrabajados: number | null;
  minutosBalance: number | null;
  minutosExtra: number | null;
  minutosCompensados: number | null;
}
