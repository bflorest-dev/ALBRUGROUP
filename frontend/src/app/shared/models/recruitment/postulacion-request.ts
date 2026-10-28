import { PostulanteRequest } from './postulante-request';

export interface PostulacionRequest {
  idOfertaLaboral?: number | null;
  origen: string;
  puestoObjetivo: string;
  negocio?: string | null;
  modalidad?: string | null;
  horario?: string | null;
  fechaPostulacion: string;
  postulante: PostulanteRequest;
}
