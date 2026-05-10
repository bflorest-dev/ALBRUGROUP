export interface TipificarPostulacionRequest {
  idTipificacion: number;
  idSubtipificacion: number;
  idGrupoCapacitacion?: number | null;
  modalidadContacto: string | null;
  observacion: string | null;
}
