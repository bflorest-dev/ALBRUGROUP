export { AuthService, type CurrentUser, AdminAuthService } from './model';
export { useAuth } from './useAuth';
export type { Role, User } from './types';
export { AuthProvider } from './ui/AuthContext';
export { HeartbeatManager } from './ui/HeartbeatManager';
// AuthRepository moved to @shared/api/repositories - export for backward compatibility
export { AuthRepository } from '@shared/api/repositories/auth.repository';
export type { LoginRequest, LoginResponse } from '@shared/api/repositories/auth.repository';
