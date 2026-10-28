import { PostulacionHistorialResponse } from './postulacion-historial-response';
import { PostulanteResponse } from './postulante-response';

export interface PostulanteHistorialResponse {
  postulante: PostulanteResponse;
  postulaciones: PostulacionHistorialResponse[];
}
