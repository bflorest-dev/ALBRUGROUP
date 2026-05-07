export type TipificationOptionId = string;

export interface TipificationBlock {
  id: string;
  name?: string;
  status?: string;
  label?: string;
  description?: string;
  icon?: string;
  color?: string;
  options: Array<{ id: TipificationOptionId; label: string; description?: string }>;
}

export interface TipificationFilter {
  blockId?: string;
  optionId?: TipificationOptionId;
  status?: string;
  includeUntipified?: boolean;
}
