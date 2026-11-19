export type MeetAsistencia = 'ASISTIO' | 'NO_ASISTIO';
export type MeetEvaluacion = 'APROBADO' | 'RECHAZADO';

export interface MeetAsistenciaBatchItemRequest {
  idPostulacion: number;
  asistencia: MeetAsistencia;
  observacion?: string | null;
  revisionEsperada?: number | null;
}

export interface MeetAsistenciaBatchRequest {
  items: MeetAsistenciaBatchItemRequest[];
}

export interface MeetEvaluacionBatchItemRequest {
  idPostulacion: number;
  resultado: MeetEvaluacion;
  motivo: string;
  observacion: string;
  revisionEsperada?: number | null;
}

export interface MeetEvaluacionBatchRequest {
  items: MeetEvaluacionBatchItemRequest[];
}

export interface MeetBatchResponse {
  procesados: number;
  idsPostulaciones: number[];
}
