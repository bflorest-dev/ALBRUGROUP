// Atomic Design - Organisms level
// Complex component groups combining molecules: containers, modals, layouts, etc.

export * from './contenedores';
export * from './modales';
export * from './navegadores';

// Re-exportar desde compartido
export { ErrorBoundary } from '../limitadorErrores/ErrorBoundary';
export { FeatureErrorBoundary, type FeatureErrorBoundaryProps, type FeatureErrorBoundaryState } from '../limitadorErrores/FeatureErrorBoundary';
