import { PostulacionOfertaResponse } from './postulacion-oferta-response';
import { PostulanteResponse } from './postulante-response';

export interface PostulacionResponse {
  id: number;
  idGrupoCapacitacion?: number | null;
  idEmpleadoRegistrador: number;
  origen: string;
  etapa: string;
  estado: string;
  estadoBandeja: string;
  createdAt: string;
  updatedAt: string;
  postulante: PostulanteResponse;
  ofertaLaboral: PostulacionOfertaResponse;
}
