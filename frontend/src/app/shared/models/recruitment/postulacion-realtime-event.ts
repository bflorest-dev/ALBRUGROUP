export interface PostulacionRealtimeEvent {
  tipo: string;
  origen: string;
  idPostulacion: number;
  etapa?: string | null;
  etapaAnterior?: string | null;
  estado?: string | null;
  estadoAnterior?: string | null;
  estadoBandeja?: string | null;
  estadoBandejaAnterior?: string | null;
  idGrupoCapacitacion?: number | null;
  puestoObjetivo?: string | null;
  occurredAt?: string | null;
}
