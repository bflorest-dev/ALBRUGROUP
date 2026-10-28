import { PostulacionOfertaResponse } from './postulacion-oferta-response';
import { PostulanteResponse } from './postulante-response';

export interface PostulacionResponse {
  id: number;
  idGrupoCapacitacion?: number | null;
  idEmpleadoRegistrador?: number | null;
  origen: string;
  puestoObjetivo: string;
  negocio?: string | null;
  modalidad?: string | null;
  horario?: string | null;
  fechaPostulacion: string;
  etapa: string;
  estado: string;
  estadoBandeja: string;
  createdAt: string;
  updatedAt: string;
  postulante: PostulanteResponse;
  ofertaLaboral?: PostulacionOfertaResponse | null;
}
