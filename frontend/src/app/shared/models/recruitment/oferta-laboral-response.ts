import { OfertaAmpliacionResponse } from './oferta-ampliacion-response';

export interface OfertaLaboralResponse {
  id: number;
  codigo: string;
  idSolicitante: number;
  negocio: string;
  puestoObjetivo: string;
  modalidad: string;
  horario: string;
  cantidadInicial: number;
  plazoInicial: string;
  estado: string;
  createdAt: string;
  ampliaciones: OfertaAmpliacionResponse[];
}
