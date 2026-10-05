import { BloqueHorarioRequest } from './bloque-horario-request';

/**
 * Payload de PATCH /horarios/{id}.
 * Corrige modalidad, compensable, fechaInicio opcional y detalles por dia.
 * El backend rechaza con 409 si el cambio pisa asistencias o se solapa.
 */
export interface CorregirHorarioRequest {
  modalidad: string;
  fechaInicio?: string;
  compensable: boolean;
  detalles: BloqueHorarioRequest[];
}
