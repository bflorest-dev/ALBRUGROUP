export interface BloqueHorarioRequest {
  dia: string;
  horaEntrada: string;
  horaSalida: string;
  inicioAlmuerzo: string;
  finAlmuerzo: string;
  laborable: boolean;
}
