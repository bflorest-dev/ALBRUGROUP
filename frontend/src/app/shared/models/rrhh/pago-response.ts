export interface PagoResponse {
  id: number;
  idContrato: number;
  fechaInicio: string;
  fechaFin: string;
  sueldoBase: number;
  asignacionFamiliar: number;
  bonoPuntualidad?: number | null;
  comisionSemanal?: number | null;
  comisionMensual?: number | null;
  bonoExtra?: number | null;
  sueldoTotal: number;
  createdAt: string;
  updatedAt: string;
}
