export interface GrupoCapacitacionRealtimeEvent {
  tipo: string;
  origen: string;
  idGrupoCapacitacion: number;
  codigo: string | null;
  estado: string | null;
  occurredAt: string | null;
}
