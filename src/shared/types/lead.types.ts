import type { LeadDTO as BaseLeadDTO } from './index';

export type LeadDTO = BaseLeadDTO;

export interface LeadStatus {
  id: number;
  status: string;
  total: number;
}
