export interface RegistrarPagoRequest {
  fechaInicio?: string | null;
  fechaFin?: string | null;
  asignacionFamiliar: number;
  bonoPuntualidad?: number | null;
  comisionSemanal?: number | null;
  comisionMensual?: number | null;
  bonoExtra?: number | null;
}
