/**
 * Base UI Components Export
 * Central hub for all reusable UI components
 */

// Design System Components - exports explícitos para evitar ambigüedad de resolución
// Button: exporta el wrapper legacy que usa DsButton (API establecida en el proyecto)
export { Button } from './LegacyButton';
export { buttonVariants, type ButtonProps } from './button/Button';
export { Badge, badgeVariants, type BadgeProps } from './badge/Badge';
export { Modal, modalVariants, type ModalProps } from './modal/Modal';

// Form Components - DS primitives (usar dentro de features con FormField)
export { FormField } from './form/FormField';
export { FormInput as FormInputPrimitive } from './form/FormInput';
export { FormSelect as FormSelectPrimitive } from './form/FormSelect';
export { FormTextarea as FormTextareaPrimitive } from './form/FormTextarea';
export { Form } from './Form';

// Layout Components
export * from './layout';

// Form Components - API establecida en el proyecto (label + error integrados)
export { FormInput } from './form-input/FormInput';
export { FormSelect } from './form-select/FormSelect';
export { SelectInput } from './SelectInput';

// State Components
export { EmptyState } from './EmptyState';
export { ErrorState } from './ErrorState';

// Utility Components
export { Alert, Spinner, ErrorMessage, TextArea } from './utilities/Utilities';
export { ErrorBoundary } from './ErrorBoundary';

// Re-export component groups
export * from './input';
export * from './design-system';

// Compatibility exports
export * from './ApplicantForm';
export * from './Girador';
export * from './SessionLogoutButton';

// Legacy components stubs
export * from './LeadListItem';
export * from './LeadDetailCard';
export * from './TipificationBlockPanel';

