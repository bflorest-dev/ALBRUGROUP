/** Solicitud de ampliacion de horario. fecha se omite en GTR (el backend usa hoy en America/Lima). */
export interface RegistrarAmpliacionRequest {
  fecha?: string | null;
  /** "HH:mm". */
  horaEntrada?: string | null;
  horaSalida?: string | null;
  motivo: string;
}
