export interface HorarioResponse {
  id: number;
  idEmpleado: number;
  idContrato: number;
  modalidad: string;
  horasObjetivoSemanal: number;
  horasObjetivoMensual: number;
  minutosAlmuerzo: number;
  minutosServicios: number;
  fechaInicio: string;
  fechaFin: string | null;
  compensable: boolean;
  detalles: Array<{
    id: number;
    dia: string;
    horaEntrada: string;
    horaSalida: string;
    inicioAlmuerzo: string;
    finAlmuerzo: string;
    laborable: boolean;
  }>;
  excepciones: unknown[];
}
