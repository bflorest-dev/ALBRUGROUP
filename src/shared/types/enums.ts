export enum EventNames {
  APPLICANT_CREATED = 'APPLICANT_CREATED',
  APPLICANT_UPDATED = 'APPLICANT_UPDATED',
  LEAD_CREATED = 'LEAD_CREATED',
  LEAD_UPDATED = 'LEAD_UPDATED',
}

export type Status = 'ACTIVE' | 'INACTIVE' | 'PENDING';

export type AdvisorStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'Disponible' | 'Ocupado' | 'Saturado';
export type AdvisorArea = 'COMMERCIAL' | 'BACKOFFICE' | 'GTR' | 'RRHH';

export type LeadChannel = 'FACEBOOK' | 'TIKTOK' | 'INDEED' | 'COMPUTRABAJO' | 'REFERIDO';
export type LeadFollowUpStatus = 'PENDING' | 'CONTACTED' | 'CLOSED';
export type LeadTipification = 'SIN_GESTION' | 'INTERESADO' | 'NO_INTERESADO';
export type BusinessUnit = 'ALBRU' | 'WIN' | 'CLARO';
