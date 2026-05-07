// GTR feature - Puntos de acceso público
// Página principal
export { default as PaginaGTR } from '@pages/gtr/PaginaGTR';

// Componentes UI
export { AltaLead, AsignacionLead, TablaLeadsGTR, TablaLeadsAsesorVentas } from './ui';

// Hooks
export * from './hooks';

// Repositorio y tipos - GTR Repository consolidado en LeadsRepository
// export { GtrRepository } from './model'; // DEPRECATED: usar LeadsRepository
export type {
  LeadIntakeRequest,
  LeadAsignacionRequest,
  LeadAsesorVentasResponse,
  LeadAsesorDetalleResponse,
  LeadGtrResponse,
  PermisosGTR,
} from '@entities/lead/types';
