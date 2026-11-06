// DESCANSO_EQUIPO queda solo para leer datos historicos; se elimina en la Fase 5 tras el backfill a PERMISO.
export type TipoDiaNoLaborable = 'FERIADO' | 'VACACIONES' | 'DESCANSO_MEDICO' | 'PERMISO' | 'DESCANSO_EQUIPO';
export type AlcanceDiaNoLaborable = 'GLOBAL' | 'EMPLEADO';

export interface DeclararDiaNoLaborableRequest {
  fecha: string;
  /** Fin del rango (inclusive) para varios dias (vacaciones, descanso medico). Omitir = un solo dia. */
  hasta?: string;
  tipo: TipoDiaNoLaborable;
  motivo: string;
  laborable: boolean;
  empleadoIds?: number[];
}
