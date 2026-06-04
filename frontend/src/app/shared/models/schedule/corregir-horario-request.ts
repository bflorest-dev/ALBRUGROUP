import { BloqueHorarioRequest } from './bloque-horario-request';

/**
 * Payload de PATCH /horarios/{id}.
 * No mueve la vigencia: corrige in-situ modalidad, compensable y los detalles
 * por dia del horario indicado. El backend rechaza con 409 si el horario ya
 * tiene asistencias con marcacion real.
 */
export interface CorregirHorarioRequest {
  modalidad: string;
  compensable: boolean;
  detalles: BloqueHorarioRequest[];
}
