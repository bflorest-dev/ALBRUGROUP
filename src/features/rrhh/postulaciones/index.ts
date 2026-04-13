/**
 * BARREL principal para postulaciones
 * FSD: caracteristicas/rrhh/postulaciones
 * 
 * SOLO expone el componente público: BandejaPostulaciones
 * TODO lo demás es interno del feature
 */

export { BandejaPostulaciones } from './ui';
export type {
  CrearPostulacionRequest,
  ActualizarPostulacionRequest,
  TipificarPostulacionRequest,
  ConfirmarContratacionRequest,
  PostulacionResponse,
} from './model';
