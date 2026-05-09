import { PostulacionResponse } from './postulacion-response';

export interface GrupoCapacitacionDetalleResponse {
  id: number;
  estadoCapacitacion: string;
  fechaAsignacion: string;
  fechaResultado: string | null;
  idEmpleadoContratado: number | null;
  fechaContratacion: string | null;
  cumplioTresMeses: boolean | null;
  fechaCumplioTresMeses: string | null;
  createdAt: string;
  updatedAt: string | null;
  postulacion: PostulacionResponse;
}
