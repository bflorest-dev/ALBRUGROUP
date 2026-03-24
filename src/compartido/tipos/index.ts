// Re-exportar todos los tipos desde el directorio compartido
export * from './comun';
export * from './enums';
export * from './eventos';
export * from './community';
export * from './generic-entities';

// Re-exportar tipos de dominios específicos desde entidades/ (MIGRADO EN PHASE 2D)
export * from '@entidades/lead/modelo';
export * from '@entidades/tipificacion/modelo';
export * from '@entidades/asesor/modelo';
