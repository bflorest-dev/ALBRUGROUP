// Re-export repositories for easier access
export { EmployeeRepository } from './repositories/employee.repository';
export { ApplicantRepository } from './repositories/applicant.repository';
export { AuthRepository } from './repositories/auth.repository';
export { ContractRepository } from './repositories/contract.repository';
export { LeadsRepository } from './repositories/leads.repository';
export { PresenceRepository, type ConnectedUser, type ConnectedStatus } from './repositories/presence.repository';

// Re-export HTTP clients (from consolidated httpClient.ts)
export { http, authHttp, rrhhHttp, leadsHttp, presenceHttp, createHttpClient, getStoredToken, clearSession } from './httpClient';
export type { ApiError, ApiResult } from './httpClient';

