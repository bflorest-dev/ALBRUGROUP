export type TipoDiaNoLaborable = 'FERIADO' | 'VACACIONES' | 'PERMISO' | 'DESCANSO_EQUIPO';
export type AlcanceDiaNoLaborable = 'GLOBAL' | 'EMPLEADO';

export interface DeclararDiaNoLaborableRequest {
  fecha: string;
  tipo: TipoDiaNoLaborable;
  motivo: string;
  laborable: boolean;
  empleadoIds?: number[];
}
