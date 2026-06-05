import { ExcepcionHorarioResponse } from './excepcion-horario-response';

/** Resultado de registrar una ampliacion de horario. */
export interface AmpliacionHorarioResponse {
  idEmpleado: number;
  fecha: string;
  excepcion: ExcepcionHorarioResponse;
  /** EXTENDIDA: jornada continua ampliada. REABIERTA: jornada cerrada reabierta con un tramo nuevo. */
  resultado: 'EXTENDIDA' | 'REABIERTA';
  entradaEfectiva: string | null;
  salidaEfectiva: string | null;
  jornadaReabierta: boolean;
}
