import { BloqueHorarioRequest } from './bloque-horario-request';

export interface ReemplazarHorarioRequest {
  modalidad: string;
  fechaInicio: string;
  compensable: boolean;
  detalles: BloqueHorarioRequest[];
}
