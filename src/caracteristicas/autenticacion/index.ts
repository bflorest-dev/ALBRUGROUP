/**
 * Autenticación - Feature Module
 * 
 * FSD Layer: caracteristicas
 * 
 * Re-exports:
 * - Tipos de login desde modelo/
 * - AuthService consolidado en @entidades/auth/model (no duplicar)
 */

// Re-export login types
export type { LoginRequest, LoginResponse, CurrentUser, LoginFormData } from './modelo';

// Re-export UI components
export { LoginForm } from './ui/LoginForm';

// NOTE: AuthService está consolidado en @entidades/auth/model
// Importar desde ahí: import { AuthService } from '@entidades/auth/model'
