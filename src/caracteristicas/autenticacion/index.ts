/**
 * Autenticación - Feature Module
 * 
 * FSD Layer: caracteristicas
 * 
 * Re-exports:
 * - Tipos de login desde modelo/
 * - UI Components: LoginForm, ValidateUserForm, ResetPasswordForm
 * - Page: PaginaAutenticacionAvanzada (flujo completo)
 * 
 * Flujo:
 * 1. VALIDATE_USER → GET /autorizacion/estado-acceso/{username}
 * 2. LOGIN o RESET_PASSWORD según passwordInicializada
 * 3. AuthRepository maneja los 3 endpoints
 */

// Re-export login types
export type {
  LoginRequest,
  LoginResponse,
  CurrentUser,
  LoginFormData,
} from './modelo';

// Re-export UI components (atomic components)
export { LoginForm } from './ui/LoginForm';
export { ValidateUserForm } from './ui/ValidateUserForm';
export { ResetPasswordForm } from './ui/ResetPasswordForm';

// Re-export page (container with state machine)
export { PaginaAutenticacionAvanzada } from './pages/PaginaAutenticacionAvanzada';

// NOTE: AuthService está consolidado en @entidades/auth/model
// Importar desde ahí: import { AuthService } from '@entidades/auth/model'

