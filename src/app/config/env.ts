export const env = {
  AUTH_BASE_URL: (import.meta.env.VITE_AUTH_BASE_URL as string) || '/api/auth',
  RRHH_BASE_URL: (import.meta.env.VITE_RRHH_BASE_URL as string) || '/api/rrhh',
  LEADS_BASE_URL: (import.meta.env.VITE_LEADS_BASE_URL as string) || '/api/leads',
  PRESENCE_BASE_URL: (import.meta.env.VITE_PRESENCE_BASE_URL as string) || '/api/presence',
};
