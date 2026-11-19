import { GrupoCapacitacionDetalleResponse } from './grupo-capacitacion-detalle-response';

export interface GrupoCapacitacionResponse {
  id: number;
  codigo: string;
  idCapacitador: number;
  turno: string;
  sala: string;
  fechaInicio: string;
  fechaFin: string | null;
  estado: string;
  negocio: 'WIN' | 'CLARO';
  createdAt: string;
  detalles: GrupoCapacitacionDetalleResponse[];
}
