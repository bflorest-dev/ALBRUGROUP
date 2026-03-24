// Re-exportar todos los tipos desde el directorio compartido
export * from './comun';
export * from './enums';
export * from './eventos';

// Re-exportar tipos desde la carpeta raiz src/types
export * from '../../types/index';
export { EVENT_NAMES, dispatchAppEvent } from '../../types/events';

// Re-exportar tipos de shared (migración en progreso)
export * from '../../shared/types/lead.types';
export * from '../../shared/types/tipification.types';
export * from '../../shared/types/advisor.types';

// Tipos específicos
export type { TipificationOption, TipificationOptionId } from '../../utils/tipificationConstants';
