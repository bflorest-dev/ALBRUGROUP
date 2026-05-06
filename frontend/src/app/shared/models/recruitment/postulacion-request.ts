import { PostulanteRequest } from './postulante-request';

export interface PostulacionRequest {
  idOfertaLaboral: number;
  origen: string;
  postulante: PostulanteRequest;
}
