export interface OfertaLaboralRealtimeEvent {
  tipo: string;
  origen: string;
  idOfertaLaboral: number;
  codigo: string | null;
  estado: string | null;
  occurredAt: string | null;
}
