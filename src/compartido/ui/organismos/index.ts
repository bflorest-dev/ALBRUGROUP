// Atomic Design - Organisms level
// Complex component groups combining molecules: containers, modals, layouts, etc.

export * from './contenedores';
export * from './modales';
export * from './navegadores';

// Re-exportar desde src/components/organisms
export { ErrorBoundary } from '../limitadorErrores/ErrorBoundary';
export { FeatureErrorBoundary, type FeatureErrorBoundaryProps, type FeatureErrorBoundaryState } from '../limitadorErrores/FeatureErrorBoundary';
export { LeadsListPanel } from '../../../components/organisms/LeadsListPanel/LeadsListPanel';
export { TipificationPanel } from '../../../components/organisms/TipificationPanel/TipificationPanel';
export { Header } from '../../../components/organisms/Layout/Header';
export { Sidebar } from '../../../components/organisms/Layout/Sidebar';
export { MainLayout } from '../../layout-principal/ui/MainLayout';
