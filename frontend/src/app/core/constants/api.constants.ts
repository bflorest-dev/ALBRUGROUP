import { environment } from '../../../environments/environment';

export const API_CONSTANTS = {
  gatewayBaseUrl: environment.gatewayBaseUrl,
  authBasePath: '/auth/autorizacion'
} as const;
