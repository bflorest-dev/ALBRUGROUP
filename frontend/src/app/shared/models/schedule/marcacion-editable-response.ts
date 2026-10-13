export type TipoRegistroMarcacion = 'PRINCIPAL' | 'TRAMO_ARCHIVADO';

export interface MarcacionEditableResponse {
  tipoRegistro: TipoRegistroMarcacion;
  idRegistro: number;
  origen: string | null;
  tipoTramo: string | null;
  esBase: boolean | null;
  motivo: string | null;
  entradaProgramada: string | null;
  salidaProgramada: string | null;
  entradaReal: string | null;
  salidaReal: string | null;
  abierta: boolean | null;
  salidaForzada: boolean | null;
}

export interface MarcacionPatchRequest {
  tipoRegistro: TipoRegistroMarcacion;
  idRegistro: number;
  entrada: string | null;
  salida: string | null;
}

export interface CorregirMarcacionesRequest {
  marcaciones: MarcacionPatchRequest[];
}
