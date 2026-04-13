// GTR feature - Puntos de acceso público
// Página principal
export { default as PaginaGTR } from './pages/PaginaGTR';

// Componentes UI
export { AltaLead, AsignacionLead, TablaLeadsGTR, TablaLeadsAsesorVentas } from './ui';

// Hooks
export * from './hooks';

// Repositorio y tipos
export { GtrRepository } from './model';
export type {
  LeadIntakeRequest,
  LeadAsignacionRequest,
  LeadAsesorVentasResponse,
  LeadAsesorDetalleResponse,
  LeadGtrResponse,
  PermisosGTR,
} from '@entities/lead/types';
