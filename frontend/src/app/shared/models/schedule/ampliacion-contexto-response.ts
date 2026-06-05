import { EstadoAsistencia } from './estado-asistencia';

/** Contexto del horario de un empleado en una fecha, para plantear una ampliacion. */
export interface AmpliacionContextoResponse {
  idEmpleado: number;
  fecha: string;
  tieneHorarioVigente: boolean;
  laborable: boolean;
  /** "HH:mm:ss" o null. */
  entradaProgramada: string | null;
  salidaProgramada: string | null;
  estadoActual: EstadoAsistencia;
  tieneRegistro: boolean;
  jornadaCerrada: boolean;
}
