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
  ultimaGestionAt?: string | null;
  ultimoResultado?: string | null;
  resultadoEvaluacion?: string | null;
  ultimaGestionResponsableId?: number | null;
  ultimaGestionModalidad?: string | null;
  proximaActividadAt?: string | null;
  proximaActividadTipo?: string | null;
  postulante: PostulanteResponse;
  ofertaLaboral?: PostulacionOfertaResponse | null;
}
