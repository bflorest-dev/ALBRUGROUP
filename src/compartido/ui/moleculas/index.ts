// Atomic Design - Molecules level
// Simple component groups combining atoms: forms, navigation, cards, etc.

export * from './formularios';
export * from './navegacion';
export * from './tarjetas';

// Re-exportar desde src/components/molecules (COMPONENTES LEGACY ELIMINADOS)
// export { ApplicantForm } from '../../../components/molecules/ApplicantForm/ApplicantForm';
// export { Modal } from '../../../components/molecules/Modal/Modal';
// export { DataTable, type DataTableColumn } from '../../../components/molecules/DataTable/DataTable';
// export { LeadDetailCard } from '../../../components/molecules/LeadDetailCard/LeadDetailCard';
// export { TipificationBlockPanel } from '../../../components/molecules/TipificationBlockPanel/TipificationBlockPanel';
// export { StatCard } from '../../../components/molecules/StatCard/StatCard';
// export { StatCard as MetricsPanel } from '../../../components/molecules/StatCard/StatCard';
// export { Pagination } from '../../../components/molecules/Pagination/Pagination';
// export { Card } from '../../../components/molecules/Card/Card';
export { MainLayout } from '@widgets/layout-principal/ui/MainLayout';
export { HeaderActions } from '@widgets/encabezado/ui/HeaderActions';
export { DatePicker } from '../selectorFecha/SelectorFecha';
