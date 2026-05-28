export interface BloqueHorarioRequest {
  dia: string;
  horaEntrada: string;
  horaSalida: string;
  inicioAlmuerzo: string | null;
  finAlmuerzo: string | null;
  laborable: boolean;
}
