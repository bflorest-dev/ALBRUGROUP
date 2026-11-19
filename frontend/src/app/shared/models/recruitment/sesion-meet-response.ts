import { PostulacionResponse } from './postulacion-response';

export interface SesionMeetResponse {
  id: number;
  negocio: string;
  fecha: string;
  fechaHoraInicio: string;
  horarioId: number | null;
  horarioEtiqueta: string;
  enlace: string | null;
  estado: string;
  postulaciones: PostulacionResponse[];
  participantes: SesionMeetParticipanteResponse[];
}

export interface SesionMeetParticipanteResponse {
  idPostulacion: number;
  postulacion: PostulacionResponse;
  asistencia: 'PENDIENTE' | 'ASISTIO' | 'NO_ASISTIO';
  resultadoEvaluacion: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | null;
  evaluadaAt: string | null;
  responsableId: number | null;
  revision: number | null;
}
