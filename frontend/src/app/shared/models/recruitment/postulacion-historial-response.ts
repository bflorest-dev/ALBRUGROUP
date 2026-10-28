import { EventoResponse } from './evento-response';
import { PostulacionResponse } from './postulacion-response';

export interface PostulacionHistorialResponse {
  postulacion: PostulacionResponse;
  eventos: EventoResponse[];
}
