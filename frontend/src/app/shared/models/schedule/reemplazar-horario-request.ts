import { BloqueHorarioRequest } from './bloque-horario-request';

export interface ReemplazarHorarioRequest {
  modalidad: string;
  fechaInicio: string;
  correccionRetroactiva?: boolean;
  compensable: boolean;
  detalles: BloqueHorarioRequest[];
}
