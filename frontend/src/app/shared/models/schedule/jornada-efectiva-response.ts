export type OrigenAjusteJornada =
  | 'REEMPLAZO_BASE'
  | 'JORNADA_EXTRAORDINARIA'
  | 'TRAMO_ADICIONAL';

export interface TramoJornadaResponse {
  idAjuste: number | null;
  inicio: string;
  fin: string;
  origen: OrigenAjusteJornada | null;
  base: boolean;
  motivo: string | null;
}

export interface JornadaEfectivaResponse {
  idEmpleado: number;
  idHorario: number;
  fecha: string;
  laborableBase: boolean;
  tramos: TramoJornadaResponse[];
  tramoActual: TramoJornadaResponse | null;
  proximoTramo: TramoJornadaResponse | null;
}

export interface AjusteJornadaRequest {
  inicio: string;
  fin: string;
  motivo: string;
}

export interface AjusteJornadaResponse {
  id: number;
  idEmpleado: number;
  idHorario: number;
  fecha: string;
  inicio: string;
  fin: string;
  estado: 'ACTIVO' | 'REEMPLAZADO' | 'CANCELADO';
  origen: OrigenAjusteJornada;
  motivo: string;
  creadoPor: number;
  reemplazadoPorId: number | null;
  createdAt: string;
}

export interface PreviewAjusteJornadaResponse {
  idEmpleado: number;
  inicioSolicitado: string;
  finSolicitado: string;
  inicioAplicado: string;
  finAplicado: string;
  resultado: OrigenAjusteJornada;
  normalizacion: string | null;
  ajustesReemplazados: number[];
  jornadaAnterior: JornadaEfectivaResponse;
  jornadaResultante: JornadaEfectivaResponse;
}
