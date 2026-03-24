/**
 * Base UI Components
 * 
 * This module acts as a compatibility layer.
 * Domain-specific components have been moved to entidades/ (PHASE 2D).
 * Re-exporting them here maintains backward compatibility.
 * 
 * NEW PREFERRED IMPORTS:
 * - import { LeadDetailCard } from '@entidades/lead/ui'
 * - import { TipificationBlockPanel } from '@entidades/tipificacion/ui'
 * - import { ApplicantForm } from '@entidades/candidato/ui'
 */

// Generic UI components (remain here as they're used across domains)
export { Modal, type ModalProps } from './Modal';
export { Button, type ButtonProps } from './Button';
export { Boton, type BotonProps } from './Boton';
export { Girador, type GiradorProps } from './Girador';
export { Entrada, type EntradaProps } from './Entrada';

// Domain-specific components (now re-exported from entidades/ - MIGRATED IN PHASE 2D)
export { LeadDetailCard, type LeadDetailCardProps } from '@entidades/lead/ui';
export { LeadListItem, type LeadListItemProps } from '@entidades/lead/ui';
export { TipificationBlockPanel, type TipificationBlockPanelProps } from '@entidades/tipificacion/ui';
export { TipificationOption, type TipificationOptionProps } from '@entidades/tipificacion/ui';
export { ApplicantForm, type ApplicantFormProps } from '@entidades/candidato/ui';

// Widget components (stub placeholders - may be removed or enhanced later)
export type { TipificationOption as ITipificationOption } from '@entidades/tipificacion/modelo';
