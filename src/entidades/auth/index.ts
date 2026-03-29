export { AuthService } from './model';
export type { CurrentUser } from './model';
// AuthRepository moved to @shared/api/repositories - export for backward compatibility
export { AuthRepository } from '@shared/api/repositories/auth.repository';
export type { LoginRequest, LoginResponse } from '@shared/api/repositories/auth.repository';
