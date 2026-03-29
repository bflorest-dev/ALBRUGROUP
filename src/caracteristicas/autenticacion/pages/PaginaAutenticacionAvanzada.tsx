import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { AuthRepository } from '@shared/api';
import { AuthService } from '@entidades/auth/model/auth.service';
import { useAuth } from '@shared/auth/useAuth';
import type { LoginFormData } from '../modelo';
import type { ForgotPasswordResponse } from '@shared/types';
import { LoginForm } from '../ui/LoginForm';
import { ValidateUserForm } from '../ui/ValidateUserForm';
import { ResetPasswordForm } from '../ui/ResetPasswordForm';
import '@shared/ui/styles/auth.css';

/**
 * MÁQUINA DE ESTADOS: Flujo de Autenticación con Validación Previa
 * 
 * Estados:
 * - VALIDATE_USER: Paso 1 - Validar usuario y obtener estado de contraseña
 * - LOGIN: Paso 2 - Mostrar login si passwordInicializada === true
 * - RESET_PASSWORD: Paso 3 - Mostrar reset si passwordInicializada === false
 * 
 * FSD: caracteristicas/autenticacion/pages
 * Importa: ValidateUserForm, LoginForm, ResetPasswordForm desde ui/
 * Usa: AuthRepository para llamadas HTTP
 * Acciones: Guarda token, redirige a dashboard, maneja errores
 * Estilos: @shared/ui/styles/auth.css
 */

type AuthState = 'VALIDATE_USER' | 'LOGIN' | 'RESET_PASSWORD';

const roleRoutes: Record<string, string> = {
  COMMUNITY: '/community/dashboard',
  GTR: '/gtr/dashboard',
  ASESOR_GTR: '/gtr/dashboard',
  SUPERVISOR_GTR: '/gtr/dashboard',
  ASESOR_VENTAS: '/ventas/dashboard',
  ASESOR_DE_VENTAS: '/ventas/dashboard',
  SUPERVISOR_VENTAS: '/ventas/dashboard',
  ASESOR_BACKOFFICE: '/backoffice/dashboard',
  SUPERVISOR_BACKOFFICE: '/backoffice/dashboard',
  ADMINISTRADOR: '/panel',
};

const getDestinationByRole = (role?: string) => {
  if (!role) return null;
  const normalized = role.toUpperCase().replace(/\s+/g, '_');
  return roleRoutes[normalized] ?? null;
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

  // Prevenir que se muestre spinner innecesario al montar
  useEffect(() => {
    console.log(`[AUTH FLOW] Componente montado e n estado: ${flowState.state}`);
  }, []);

  /**
   * PASO 1: Validar usuario y obtener estado de contraseña
   * 
   * - Llamar: GET /autorizacion/estado-acceso/{username}
   * - Si passwordInicializada === true → ir a LOGIN
   * - Si passwordInicializada === false → ir a RESET_PASSWORD
   * - Si error → mostrar mensaje y permitir re-intentar
   */
  const handleValidateUser = useCallback(async (username: string) => {
    setFlowState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      console.log(`[AUTH FLOW] 🔍 Validando usuario: ${username}`);
      console.log(`[AUTH FLOW] 🌐 GET /api/auth/autorizacion/estado-acceso/${username}`);

      const response = await AuthRepository.obtenerEstadoAcceso(username);

      console.log('[AUTH FLOW] ✅ Respuesta de validación:', response);

      // Guardar username y cambiar estado según passwordInicializada
      const nextState: AuthState = response.passwordInicializada
        ? 'LOGIN'
        : 'RESET_PASSWORD';

      setFlowState((prev) => ({
        ...prev,
        username,
        state: nextState,
        loading: false,
        error: null,
        message: undefined,
        resetSuccess: false,
      }));

      // Log para debugging
      console.log(`[AUTH FLOW] ✨ Usuario validado: ${username}`);
      console.log(
        `[AUTH FLOW] 🔑 passwordInicializada: ${response.passwordInicializada}`
      );
      console.log(`[AUTH FLOW] → Transición a estado: ${nextState}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('[AUTH FLOW] ❌ Error al validar usuario:', errorMessage);

      // Detectar errores de conexión
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('connect')) {
        console.error('[AUTH FLOW] 🚨 Problemas de conexión con el servidor');
        console.error('[AUTH FLOW] 🔧 Verifica que el backend esté corriendo en http://localhost:8080');
      }

      setFlowState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
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
      setFlowState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        console.log(
          `[AUTH FLOW] 🔓 Iniciando login para usuario: ${formData.username}`
        );
        console.log('[AUTH FLOW] 🌐 POST /api/auth/autorizacion/login');

        const response = await AuthService.login({
          username: formData.username,
          password: formData.password,
        });

        console.log('[AUTH FLOW] ✅ Login successful, response:', {
          username: response.username,
          token: response.token ? 'present' : 'missing',
          roles: response.roles,
        });

        // Sincronizar contexto global (AuthProvider) + localStorage ya lo hace AuthService
        await authLogin(formData.username, formData.password).catch(() => null);

        console.log('[AUTH FLOW] 📝 AuthContext sincronizado');

        // Determinar rol
        const responseRole = (response as any).usuario?.rol ||
          (response as any).role ||
          (response.roles && response.roles[0]);
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
    [navigate, authLogin]
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
        const response = await AuthRepository.olvidoContraseña({
          username: flowState.username,
          email,
          dni,
        });

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
        setFlowState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Error al resetear contraseña',
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
              className={`step ${flowState.state === 'VALIDATE_USER' ? 'active' : ''}`}
            >
              <span className="step-number">1</span>
              <span className="step-label">Validar</span>
            </div>
            <div className="step-separator"></div>
            <div
              className={`step ${
                flowState.state === 'LOGIN' ? 'active' : ''
              }`}
            >
              <span className="step-number">2</span>
              <span className="step-label">Ingresar</span>
            </div>
            <div className="step-separator"></div>
            <div
              className={`step ${
                flowState.state === 'RESET_PASSWORD' ? 'active' : ''
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
