// Entity: Tipificación
// Lead typification domain model and related UI components

// Export UI components
export * from './ui';

// Re-export types from modelo, but exclude TipificationOption to avoid conflict with component
export { type TipificationStatus, type ConversionOptionId, type FollowUpOptionId, type RejectionOptionId, type NoContactOptionId, type ProgrammedOptionId, type TipificationOptionId, type TipificationBlock, type LeadTipificationRecord, type TipificationState, type TipificationFilter, type UpdateTipificationRequest, type UpdateTipificationResponse } from './modelo';
