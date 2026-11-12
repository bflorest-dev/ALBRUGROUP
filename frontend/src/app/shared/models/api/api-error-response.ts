export interface ApiErrorResponse {
  status: number;
  error: string;
  message: string;
  details?: string[];
  code?: string;
  constraint?: string;
  table?: string;
  column?: string;
}
