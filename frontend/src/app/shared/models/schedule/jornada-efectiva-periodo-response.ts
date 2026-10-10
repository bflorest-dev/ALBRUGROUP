import {
  AlcanceDiaNoLaborable,
  TipoDiaNoLaborable
} from './dia-no-laborable-request';
import {
  OrigenAjusteJornada,
  RazonAjuste
} from './jornada-efectiva-response';

export interface HorarioBasePeriodoResponse {
  laborable: boolean;
  inicio: string | null;
  fin: string | null;
  almuerzoInicio: string | null;
  almuerzoFin: string | null;
}

export interface TramoJornadaPeriodoResponse {
  idAjuste: number | null;
  inicio: string;
  fin: string;
  origen: OrigenAjusteJornada | null;
  razon: RazonAjuste | null;
  esBaseEfectiva: boolean;
  motivo: string | null;
}

export interface JornadaPeriodoEfectivaResponse {
  laborable: boolean;
  tramos: TramoJornadaPeriodoResponse[];
}

export interface AlmuerzoPeriodoResponse {
  inicioBase: string | null;
  finBase: string | null;
  inicioEfectivo: string | null;
  finEfectivo: string | null;
  modificado: boolean;
  fuente: string | null;
}

export type CambioJornadaPeriodoTipo =
  | 'AJUSTE_JORNADA'
  | 'DIA_NO_LABORABLE'
  | 'EXCEPCION_HORARIO'
  | 'CAMBIO_ALMUERZO';

export interface CambioJornadaPeriodoResponse {
  id: number | null;
  tipo: CambioJornadaPeriodoTipo;
  codigo: string;
  fuente: string;
  inicio: string | null;
  fin: string | null;
  almuerzoInicio: string | null;
  almuerzoFin: string | null;
  laborable: boolean | null;
  origen: OrigenAjusteJornada | null;
  razon: RazonAjuste | null;
  tipoExcepcion: string | null;
  tipoDiaNoLaborable: TipoDiaNoLaborable | null;
  alcance: AlcanceDiaNoLaborable | null;
  motivo: string | null;
}

export interface JornadaEfectivaPeriodoDiaResponse {
  fecha: string;
  esHoy: boolean;
  idHorario: number | null;
  estado: 'CON_HORARIO' | 'DESCANSO_BASE' | 'DIA_LIBRE' | 'SIN_HORARIO' | string;
  horarioBase: HorarioBasePeriodoResponse | null;
  jornadaEfectiva: JornadaPeriodoEfectivaResponse;
  almuerzo: AlmuerzoPeriodoResponse | null;
  cambios: CambioJornadaPeriodoResponse[];
}

export interface JornadaEfectivaPeriodoResponse {
  idEmpleado: number;
  desde: string;
  hasta: string;
  dias: JornadaEfectivaPeriodoDiaResponse[];
}
