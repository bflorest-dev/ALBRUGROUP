import { ExcepcionHorarioResponse } from './excepcion-horario-response';

export interface HorarioMesVigenciaResponse {
  idHorario: number;
  modalidad: string;
  horasObjetivoSemanal: number;
  horasObjetivoMensual: number;
  minutosAlmuerzo: number;
  minutosServicios: number;
  fechaInicio: string;
  fechaFin: string | null;
  desdeAplicacion: string;
  hastaAplicacion: string;
  compensable: boolean;
  detallesBase: Array<{
    id: number;
    dia: string;
    horaEntrada: string;
    horaSalida: string;
    inicioAlmuerzo: string | null;
    finAlmuerzo: string | null;
    laborable: boolean;
  }>;
  modificaciones: ExcepcionHorarioResponse[];
}

export interface HorarioMesResponse {
  idEmpleado: number;
  anio: number;
  mes: number;
  vigencias: HorarioMesVigenciaResponse[];
}
