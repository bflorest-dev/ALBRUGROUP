export interface ExcepcionHorarioResponse {
  id: number;
  fecha: string;
  tipo: string;
  horaEntrada?: string | null;
  horaSalida?: string | null;
  inicioAlmuerzo?: string | null;
  finAlmuerzo?: string | null;
  laborable?: boolean | null;
  motivo: string;
  creadoPor?: number | null;
}
