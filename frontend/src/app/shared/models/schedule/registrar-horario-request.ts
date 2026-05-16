import { BloqueHorarioRequest } from './bloque-horario-request';

export interface RegistrarHorarioRequest {
  idEmpleado: number;
  idContrato: number;
  modalidad: string;
  fechaInicio: string;
  compensable: boolean;
  detalles: BloqueHorarioRequest[];
}
