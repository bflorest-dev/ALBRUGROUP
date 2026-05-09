export interface EventoResponse {
  id: number;
  idPostulacion: number;
  idEmpleadoResponsable: number;
  etapa: string;
  accion: string;
  modalidadContacto: string | null;
  idTipificacion: number | null;
  idSubtipificacion: number | null;
  tipificacion: string | null;
  subtipificacion: string | null;
  observacion: string | null;
  createdAt: string;
}
