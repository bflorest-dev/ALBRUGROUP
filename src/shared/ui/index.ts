/**
 * Base UI Components Export
 * Central hub for all reusable UI components
 */

// Form Components
export { FormInput } from './form-input/FormInput';
export { FormSelect } from './form-select/FormSelect';
export { SelectInput } from './SelectInput';
export { SessionLogoutButton } from './SessionLogoutButton';

// Modal Components
export { Modal } from './Modal';

// State Components
export { EmptyState } from './EmptyState';
export { ErrorState } from './ErrorState';

// Utility Components (excluding Button to avoid conflicts)
export { Alert, Spinner, Badge, ErrorMessage, TextArea } from './utilities/Utilities';

// Re-export component groups
export * from './button/index';
export * from './input';
export * from './badge';
export * from './design-system';
export * from './date-picker';

// Compatibility exports
export * from './ApplicantForm';
export * from './Button';
export * from './Girador';

// Legacy components stubs
export * from './LeadListItem';
export * from './LeadDetailCard';
export * from './TipificationBlockPanel';

