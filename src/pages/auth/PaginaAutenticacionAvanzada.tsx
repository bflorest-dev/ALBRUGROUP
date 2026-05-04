import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { AuthRepository } from '@shared/api';
import { AuthService } from '@entities/auth/model/auth.service';
import { useAuth } from '@entities/auth';
import { routeHelpers } from '@shared/utils/routeHelpers';
import type { LoginFormData } from '@features/auth/model';
import type { ForgotPasswordResponse } from '@shared/types';
import { LoginForm } from '@features/auth/ui/LoginForm';
import { ValidateUserForm } from '@features/auth/ui/ValidateUserForm';
import { ResetPasswordForm } from '@features/auth/ui/ResetPasswordForm';
import '@shared/ui/styles/auth.css';

/**
 * MÁQUINA DE ESTADOS: Flujo de Autenticación Simplificado
 * 
 * Estados:
 * - VALIDATE_USER: Paso 1 - Capturar username (sin validación backend)
 * - LOGIN: Paso 2 - Autenticar con username y password
 * - RESET_PASSWORD: Paso 3 - Resetear contraseña olvidada (accesible desde LOGIN)
 * 
 * NOTA: El endpoint /autorizacion/estado-acceso/{username} requiere autenticación,
 * por lo que no se puede usar antes del login. El flujo va directo de VALIDATE_USER a LOGIN.
 * 
 * FSD: caracteristicas/autenticacion/pages
 * Importa: ValidateUserForm, LoginForm, ResetPasswordForm desde ui/
 * Usa: AuthRepository para llamadas HTTP
 * Acciones: Guarda token, redirige a dashboard, maneja errores
 * Estilos: @shared/ui/styles/auth.css
 */

type AuthState = 'VALIDATE_USER' | 'LOGIN' | 'RESET_PASSWORD';

const AUTH_STEPS: Record<AuthState, number> = {
  VALIDATE_USER: 1,
  LOGIN: 2,
  RESET_PASSWORD: 3,
};

const getDestinationByRole = (role?: string) => {
  if (!role) return null;
  const normalized = role.toUpperCase().replace(/\s+/g, '_');
  return routeHelpers.getRedirectPath([normalized]);
};

interface AuthFlowState {
  state: AuthState;
  username: string;
  loading: boolean;
  error: string | null;
  message?: string;
  resetSuccess: boolean;
  generatedPassword?: string;
}

const getRoleFromLoginResponse = (response: unknown): string | null => {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const record = response as Record<string, unknown>;
  const usuario = record.usuario;

  if (usuario && typeof usuario === 'object') {
    const usuarioRecord = usuario as Record<string, unknown>;
    if (typeof usuarioRecord.rol === 'string') {
      return usuarioRecord.rol;
    }
  }

  if (typeof record.role === 'string') {
    return record.role;
  }

  if (Array.isArray(record.roles) && typeof record.roles[0] === 'string') {
    return record.roles[0];
  }

  return null;
};

export const PaginaAutenticacionAvanzada: React.FC = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [flowState, setFlowState] = useState<AuthFlowState>({
    state: 'VALIDATE_USER',
    username: '',
    loading: false,
    error: null,
    resetSuccess: false,
  });
  const currentStep = AUTH_STEPS[flowState.state];

  // Prevenir que se muestre spinner innecesario al montar
  useEffect(() => {
    console.log(`[AUTH FLOW] Componente montado e n estado: ${flowState.state}`);
  }, [flowState.state]);

  /**
   * PASO 1: Validar usuario (SIMPLIFICADO)
   * 
   * NOTA: El endpoint /autorizacion/estado-acceso/{username} requiere token Bearer,
   * por lo que NO se puede usar antes del login. En su lugar, vamos directo a LOGIN.
   * 
   * Si el usuario necesita resetear su contraseña, puede usar el link "Olvidé mi contraseña"
   * desde el formulario de login.
   */
  const handleValidateUser = useCallback(async (username: string) => {
    console.log(`[AUTH FLOW] 🔍 Usuario ingresado: ${username}`);
    console.log('[AUTH FLOW] → Ir directo a LOGIN (endpoint estado-acceso requiere autenticación)');

    // Ir directo a LOGIN sin validación previa
    setFlowState((prev) => ({
      ...prev,
      username,
      state: 'LOGIN',
      loading: false,
      error: null,
      message: undefined,
      resetSuccess: false,
    }));
  }, []);

  /**
   * PASO 2: Iniciar sesión
   * 
   * - Llamar: POST /autorizacion/login { username, password }
   * - Si success: Guardar token, inicializar contexto, redirigir a dashboard
   * - Si error: Mostrar mensaje sin perder el username
   */
  const handleLogin = useCallback(
    async (formData: LoginFormData) => {
      const username = flowState.username || formData.username;

      setFlowState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        console.log(
          `[AUTH FLOW] 🔓 Iniciando login para usuario: ${username}`
        );
        console.log('[AUTH FLOW] 🌐 POST /api/auth/autorizacion/login');

        const response = await AuthService.login({
          username,
          password: formData.password,
        });

        console.log('[AUTH FLOW] ✅ Login successful, response:', {
          username: response.username,
          token: response.token ? 'present' : 'missing',
          roles: response.roles,
        });

        // Sincronizar contexto global (AuthProvider) + localStorage ya lo hace AuthService
        await authLogin(username, formData.password).catch(() => null);

        console.log('[AUTH FLOW] 📝 AuthContext sincronizado');

        // Determinar rol
        const responseRole = getRoleFromLoginResponse(response);
        const tokenRole = AuthService.getRoleFromToken(response.token);
        const role = ((responseRole || tokenRole || '') as string).toUpperCase();

        console.log('[AUTH FLOW] 🔑 Role resolution:', {
          responseRole,
          tokenRole,
          finalRole: role,
        });

        if (!role) {
          setFlowState((prev) => ({
            ...prev,
            loading: false,
            error: 'Usuario sin rol asignado',
          }));
          console.error(
            '[AUTH FLOW] ❌ No role found in response or token'
          );
          return;
        }

        const destination = getDestinationByRole(role);
        if (!destination) {
          console.error(
            '[AUTH FLOW] ❌ Rol no reconocido o sin ruta:',
            role
          );
          setFlowState((prev) => ({
            ...prev,
            loading: false,
            error: 'Rol no reconocido o no tiene ruta asignada',
          }));
          return;
        }

        console.log(`[AUTH FLOW] ✨ Login exitoso: ${response.username}`);
        console.log(`[AUTH FLOW] 👤 Rol detectado: ${role}`);
        console.log(`[AUTH FLOW] 🎯 Redirigiendo a: ${destination}`);
        console.log(
          '[AUTH FLOW] 💾 Token guardado en localStorage (auth_token)'
        );

        // Redirigir según rol
        navigate(destination, { replace: true });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Credenciales inválidas';
        console.error('[AUTH FLOW] ❌ Login error:', errorMessage);

        // Detectar errores de conexión
        if (
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('connect') ||
          errorMessage.includes('NETWORK')
        ) {
          console.error(
            '[AUTH FLOW] 🚨 No hay conexión con el servidor.'
          );
          console.error(
            '[AUTH FLOW] 🔧 Verifica que el backend esté corriendo en http://localhost:8080'
          );
        }

        setFlowState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    },
    [navigate, authLogin, flowState.username]
  );

  /**
   * PASO 3: Resetear contraseña olvidada
   * 
   * - Llamar: POST /autorizacion/forgot-password { username, email, dni }
   * - Si success: Mostrar confirmación temporal y volver a VALIDATE_USER
   * - Si error: Mostrar mensaje
   */
  const handleResetPassword = useCallback(
    async (email: string, dni: string): Promise<ForgotPasswordResponse> => {
      setFlowState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const payload = {
          username: flowState.username,
          email,
          dni,
        };

        console.log('[AUTH FLOW] 📤 Enviando request de reset password:', payload);

        const response = await AuthRepository.olvidoContraseña(payload);

        console.log('[AUTH FLOW] 📥 Respuesta de reset password:', response);
        console.log(`[AUTH FLOW] Reset de contraseña exitoso para: ${flowState.username}`);

        setFlowState((prev) => ({
          ...prev,
          message: response.message || 'Contraseña reseteada correctamente',
          loading: false,
          resetSuccess: true,
          generatedPassword: response.password,
          error: null,
        }));

        return response;
      } catch (err) {
        console.error('[AUTH FLOW] ❌ Error en reset password:', err);
        
        // Extraer mensaje de error más detallado
        let errorMessage = 'Error al resetear contraseña';
        
        if (err instanceof Error) {
          errorMessage = err.message;
          
          // Si el error contiene información de validación del backend
          if (errorMessage.includes('Contrato API invalido')) {
            errorMessage = 'Error de validación: Los datos enviados no cumplen con el formato esperado por el servidor. Por favor, verifica que el email y DNI sean correctos.';
          } else if (errorMessage.includes('digest')) {
            errorMessage = 'Error del servidor: Problema con la validación de datos. Por favor, contacta al administrador del sistema.';
          }
        }

        setFlowState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw err;
      }
    },
    [flowState.username]
  );

  /**
   * Volver al paso anterior o resetear flujo
   */
  const handleBack = useCallback(() => {
    setFlowState((prev) => ({
      ...prev,
      state: 'VALIDATE_USER',
      loading: false,
      error: null,
      message: undefined,
      resetSuccess: false,
    }));
    console.log('[AUTH FLOW] Volviendo a validación de usuario');
  }, []);

  const handleGoToLogin = useCallback(() => {
    setFlowState((prev) => ({
      ...prev,
      state: 'LOGIN',
      loading: false,
      error: null,
      message: undefined,
      resetSuccess: false,
    }));
  }, []);

  const handleForgotPassword = useCallback(() => {
    setFlowState((prev) => ({
      ...prev,
      state: 'RESET_PASSWORD',
      loading: false,
      error: null,
      message: undefined,
      resetSuccess: false,
    }));
  }, []);

  /**
   * Render condicional según estado actual
   */
  const renderContent = () => {
    switch (flowState.state) {
      case 'VALIDATE_USER':
        return (
          <ValidateUserForm
            onValidate={handleValidateUser}
            initialUsername={flowState.username}
            loading={flowState.loading}
            error={flowState.error || undefined}
          />
        );

      case 'LOGIN':
        return (
          <LoginForm
            username={flowState.username}
            onSubmit={handleLogin}
            onBack={handleBack}
            onForgotPassword={handleForgotPassword}
            loading={flowState.loading}
            error={flowState.error || undefined}
          />
        );

      case 'RESET_PASSWORD':
        return (
          <ResetPasswordForm
            username={flowState.username}
            onReset={handleResetPassword}
            onBack={handleBack}
            onGoToLogin={handleGoToLogin}
            resetSuccess={flowState.resetSuccess}
            generatedPassword={flowState.generatedPassword}
            loading={flowState.loading}
            error={flowState.error || undefined}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="pagina-autenticacion-avanzada">
      <div className="auth-container">
        <div className="auth-card">
          {/* Progress Stepper (Opcional) */}
          <div className="auth-steps">
            <div
              className={`step ${currentStep === 1 ? 'active' : ''}`}
            >
              <span className="step-number">1</span>
              <span className="step-label">Validar</span>
            </div>
            <div className={`step-separator ${currentStep > 1 ? 'completed' : ''}`}></div>
            <div
              className={`step ${
                currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''
              }`}
            >
              <span className="step-number">2</span>
              <span className="step-label">Ingresar</span>
            </div>
            <div className={`step-separator ${currentStep > 2 ? 'completed' : ''}`}></div>
            <div
              className={`step ${
                currentStep === 3 ? 'active' : ''
              }`}
            >
              <span className="step-number">3</span>
              <span className="step-label">Reset</span>
            </div>
          </div>

          {/* Render content based on state */}
          <div className="auth-content">
            {renderContent()}
          </div>

          {/* Footer with additional info */}
          <div className="auth-footer">
            <p className="footer-text">
              ¿Problemas para acceder? Contacta al soporte técnico
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
