import { ExcepcionHorarioResponse } from './excepcion-horario-response';

/** Resultado de registrar una ampliacion de horario. */
export interface AmpliacionHorarioResponse {
  idEmpleado: number;
  fecha: string;
  excepcion: ExcepcionHorarioResponse;
  /** HABILITADA: dia de descanso convertido en jornada. */
  resultado: 'EXTENDIDA' | 'REABIERTA' | 'HABILITADA';
  entradaEfectiva: string | null;
  salidaEfectiva: string | null;
  jornadaReabierta: boolean;
}
