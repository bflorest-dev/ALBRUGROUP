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
}
