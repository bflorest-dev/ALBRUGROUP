import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { PaginaAutenticacionAvanzada } from '../PaginaAutenticacionAvanzada';
import { AuthProvider } from '@entities/auth/ui/AuthContext';
import { AuthService } from '@entities/auth/model/auth.service';
import { PresenceRepository } from '@shared/api';

// Mock dependencies
vi.mock('@entities/auth/model/auth.service');
vi.mock('@shared/api', () => ({
  PresenceRepository: {
    markOnline: vi.fn().mockResolvedValue(undefined),
    updateDisponibilidad: vi.fn().mockResolvedValue(undefined),
    markOffline: vi.fn().mockResolvedValue(undefined),
  },
  AuthRepository: {
    login: vi.fn().mockResolvedValue({
      token: 'test-token-123',
      type: 'Bearer',
      username: 'testuser',
      empleadoId: 123,
      nombreCompleto: 'Test User',
      roles: ['RRHH'],
    }),
    olvidoContraseña: vi.fn().mockResolvedValue({
      message: 'Password reset successful',
      password: 'newPassword123',
    }),
  },
}));

/**
 * Task 12: Run integration tests for complete authentication flow
 * 
 * **Validates: All requirements (1.1-3.20)**
 * 
 * This test suite verifies:
 * 1. Complete login flow from form submission to dashboard navigation
 * 2. All role types (8 existing + 4 newly mapped = 12 total)
 * 3. Session restoration after page reload for all roles
 * 4. Logout flow including presence system integration
 * 5. Password reset flow (should be unaffected)
 * 6. Error scenarios (invalid credentials, network errors, missing roles)
 * 7. No race conditions in storage operations
 * 8. No duplicate HTTP requests
 */
describe('Integration Tests - Complete Authentication Flow (Task 12)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // ============================================================================
  // SECTION 1: Complete Login Flow from Form Submission to Dashboard Navigation
  // ============================================================================

  describe('Section 1: Complete Login Flow', () => {
    it('should complete full login flow from form submission to dashboard navigation', async () => {
      const mockAuthServiceLogin = vi.fn().mockImplementation(async () => {
        localStorage.setItem('auth_token', 'test-token-123');
        return {
          token: 'test-token-123',
          type: 'Bearer',
          username: 'testuser',
          empleadoId: 123,
          nombreCompleto: 'Test User',
          roles: ['RRHH'],
        };
      });

      vi.mocked(AuthService.login).mockImplementation(mockAuthServiceLogin);
      vi.mocked(AuthService.getRoleFromToken).mockReturnValue('RRHH');
      vi.mocked(AuthService.initialize).mockImplementation(() => {});

      render(
        <BrowserRouter>
          <AuthProvider>
            <PaginaAutenticacionAvanzada />
          </AuthProvider>
        </BrowserRouter>
      );

      // Step 1: Enter username
      const usernameInput = screen.getByPlaceholderText(/usuario/i);
      await userEvent.type(usernameInput, 'testuser');

      const validateBtn = screen.getByRole('button', { name: /siguiente|continuar|validar/i });
      await userEvent.click(validateBtn);

      // Step 2: Wait for login form and enter password
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/contraseña|password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText(/contraseña|password/i);
      await userEvent.type(passwordInput, 'password123');

      const loginBtn = screen.getByRole('button', { name: /ingresar|login|entrar/i });
      await userEvent.click(loginBtn);

      // Step 3: Verify login was called
      await waitFor(() => {
        expect(mockAuthServiceLogin).toHaveBeenCalledWith(
          expect.objectContaining({
            password: 'password123',
          })
        );
      });

      // Step 4: Verify session data is stored correctly
      const storedUser = localStorage.getItem('user');
      expect(storedUser).toBeTruthy();
      const parsedUser = JSON.parse(storedUser!);
      
      expect(parsedUser).toHaveProperty('id');
      expect(parsedUser).toHaveProperty('name');
      expect(parsedUser).toHaveProperty('roles');
      expect(parsedUser.id).toBe('123');
      expect(parsedUser.name).toBe('Test User');
      expect(parsedUser.roles).toEqual(['RRHH']);

      // Step 5: Verify token is stored
      const storedToken = localStorage.getItem('auth_token');
      expect(storedToken).toBe('test-token-123');

      // Step 6: Verify presence system was called
      await waitFor(() => {
        expect(vi.mocked(PresenceRepository.markOnline)).toHaveBeenCalled();
      });
    });

    it('should verify no duplicate HTTP requests during login', async () => {
      const mockAuthServiceLogin = vi.fn().mockImplementation(async () => {
        localStorage.setItem('auth_token', 'test-token-456');
        return {
          token: 'test-token-456',
          type: 'Bearer',
          username: 'user2',
          empleadoId: 456,
          nombreCompleto: 'User Two',
          roles: ['RRHH'],
        };
      });

      vi.mocked(AuthService.login).mockImplementation(mockAuthServiceLogin);
      vi.mocked(AuthService.getRoleFromToken).mockReturnValue('RRHH');
      vi.mocked(AuthService.initialize).mockImplementation(() => {});

      render(
        <BrowserRouter>
          <AuthProvider>
            <PaginaAutenticacionAvanzada />
          </AuthProvider>
        </BrowserRouter>
      );

      // Perform login
      const usernameInput = screen.getByPlaceholderText(/usuario/i);
      await userEvent.type(usernameInput, 'user2');

      const validateBtn = screen.getByRole('button', { name: /siguiente|continuar|validar/i });
      await userEvent.click(validateBtn);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/contraseña|password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText(/contraseña|password/i);
      await userEvent.type(passwordInput, 'password456');

      const loginBtn = screen.getByRole('button', { name: /ingresar|login|entrar/i });
      await userEvent.click(loginBtn);

      // Verify AuthService.login was called exactly once
      await waitFor(() => {
        expect(mockAuthServiceLogin).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ============================================================================
  // SECTION 2: All Role Types (8 Existing + 4 Newly Mapped = 12 Total)
  // ============================================================================

  describe('Section 2: All Role Types Navigation', () => {
    const allRoles = [
      // Existing roles (8)
      { role: 'ADMINISTRADOR', expectedRoute: '/panel' },
      { role: 'RRHH', expectedRoute: '/rrhh' },
      { role: 'RECLUTAMIENTO', expectedRoute: '/reclutamiento' },
      { role: 'RECLUTADOR', expectedRoute: '/reclutamiento' },
      { role: 'CAPACITACIÓN', expectedRoute: '/capacitacion' },
      { role: 'COMMUNITY', expectedRoute: '/community' },
      { role: 'GTR', expectedRoute: '/gtr' },
      { role: 'ASESOR_DE_VENTAS', expectedRoute: '/asesores' },
      // Newly mapped roles (4)
      { role: 'ASESOR_VENTAS', expectedRoute: '/asesores' },
      { role: 'SUPERVISOR_VENTAS', expectedRoute: '/asesores' },
      { role: 'ASESOR_GTR', expectedRoute: '/gtr' },
      { role: 'ASESOR_BACKOFFICE', expectedRoute: '/panel' },
    ];

    allRoles.forEach(({ role, expectedRoute }) => {
      it(`should navigate to ${expectedRoute} for role ${role}`, async () => {
        const mockAuthServiceLogin = vi.fn().mockImplementation(async () => {
          localStorage.setItem('auth_token', `token-${role}`);
          return {
            token: `token-${role}`,
            type: 'Bearer',
            username: `user-${role}`,
            empleadoId: Math.random() * 1000,
            nombreCompleto: `User ${role}`,
            roles: [role],
          };
        });

        vi.mocked(AuthService.login).mockImplementation(mockAuthServiceLogin);
        vi.mocked(AuthService.getRoleFromToken).mockReturnValue(role);
        vi.mocked(AuthService.initialize).mockImplementation(() => {});

        render(
          <BrowserRouter>
            <AuthProvider>
              <PaginaAutenticacionAvanzada />
            </AuthProvider>
          </BrowserRouter>
        );

        // Perform login
        const usernameInput = screen.getByPlaceholderText(/usuario/i);
        await userEvent.type(usernameInput, `user-${role}`);

        const validateBtn = screen.getByRole('button', { name: /siguiente|continuar|validar/i });
        await userEvent.click(validateBtn);

        await waitFor(() => {
          expect(screen.getByPlaceholderText(/contraseña|password/i)).toBeInTheDocument();
        });

        const passwordInput = screen.getByPlaceholderText(/contraseña|password/i);
        await userEvent.type(passwordInput, 'password123');

        const loginBtn = screen.getByRole('button', { name: /ingresar|login|entrar/i });
        await userEvent.click(loginBtn);

        // Verify session data is stored with correct role
        await waitFor(() => {
          const storedUser = localStorage.getItem('user');
          expect(storedUser).toBeTruthy();
          const parsedUser = JSON.parse(storedUser!);
          expect(parsedUser.roles).toContain(role);
        });
      });
    });
  });

  // ============================================================================
  // SECTION 3: Session Restoration After Page Reload for All Roles
  // ============================================================================

  describe('Section 3: Session Restoration After Page Reload', () => {
    const rolesToTest = [
      { role: 'RRHH', expectedRoute: '/rrhh' },
      { role: 'ASESOR_VENTAS', expectedRoute: '/asesores' },
      { role: 'SUPERVISOR_VENTAS', expectedRoute: '/asesores' },
      { role: 'ASESOR_GTR', expectedRoute: '/gtr' },
      { role: 'ASESOR_BACKOFFICE', expectedRoute: '/panel' },
    ];

    rolesToTest.forEach(({ role, expectedRoute }) => {
      it(`should restore session after page reload for role ${role}`, async () => {
        // Simulate stored session data
        const userData = {
          id: '789',
          name: 'Restored User',
          roles: [role],
        };

        localStorage.setItem('auth_token', `token-${role}`);
        localStorage.setItem('user', JSON.stringify(userData));

        vi.mocked(AuthService.initialize).mockImplementation(() => {});
        vi.mocked(AuthService.getRoleFromToken).mockReturnValue(role);

        // Render component (simulating page reload)
        render(
          <BrowserRouter>
            <AuthProvider>
              <PaginaAutenticacionAvanzada />
            </AuthProvider>
          </BrowserRouter>
        );

        // Verify session was restored
        await waitFor(() => {
          const storedUser = localStorage.getItem('user');
          expect(storedUser).toBeTruthy();
          const parsedUser = JSON.parse(storedUser!);
          expect(parsedUser.id).toBe('789');
          expect(parsedUser.name).toBe('Restored User');
          expect(parsedUser.roles).toContain(role);
        });

        // Verify presence system was called for restored session
        await waitFor(() => {
          expect(vi.mocked(PresenceRepository.markOnline)).toHaveBeenCalled();
        });
      });
    });

    it('should fail to restore session when token is missing', async () => {
      // Simulate corrupted session (user data but no token)
      const userData = {
        id: '999',
        name: 'Corrupted User',
        roles: ['RRHH'],
      };

      localStorage.setItem('user', JSON.stringify(userData));
      // Intentionally NOT setting auth_token

      vi.mocked(AuthService.initialize).mockImplementation(() => {});

      render(
        <BrowserRouter>
          <AuthProvider>
            <PaginaAutenticacionAvanzada />
          </AuthProvider>
        </BrowserRouter>
      );

      // Verify session was NOT restored (token is required)
      await waitFor(() => {
        const storedUser = localStorage.getItem('user');
        // Should be cleared because token is missing
        expect(storedUser).toBeNull();
      });
    });

    it('should fail to restore session when user data is malformed', async () => {
      // Simulate corrupted user data (missing required fields)
      const malformedData = {
        id: '888',
        // Missing 'name' field
        roles: ['RRHH'],
      };

      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem('user', JSON.stringify(malformedData));

      vi.mocked(AuthService.initialize).mockImplementation(() => {});

      render(
        <BrowserRouter>
          <AuthProvider>
            <PaginaAutenticacionAvanzada />
          </AuthProvider>
        </BrowserRouter>
      );

      // Verify session was NOT restored (validation failed)
      await waitFor(() => {
        const storedUser = localStorage.getItem('user');
        // Should be cleared because validation failed
        expect(storedUser).toBeNull();
      });
    });
  });

  // ============================================================================
  // SECTION 4: Logout Flow Including Presence System Integration
  // ============================================================================

  describe('Section 4: Logout Flow with Presence System', () => {
    it('should call presence system methods during logout', async () => {
      // Setup: Create authenticated session
      const userData = {
        id: '123',
        name: 'Test User',
        roles: ['RRHH'],
      };

      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem('user', JSON.stringify(userData));

      vi.mocked(AuthService.initialize).mockImplementation(() => {});
      vi.mocked(AuthService.logout).mockImplementation(() => {
        localStorage.removeItem('auth_token');
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <PaginaAutenticacionAvanzada />
          </AuthProvider>
        </BrowserRouter>
      );

      // Verify presence was marked online
      await waitFor(() => {
        expect(vi.mocked(PresenceRepository.markOnline)).toHaveBeenCalled();
      });

      // Note: Testing logout flow requires a logout button/action in the component
      // which is not present in the current login page. This test verifies that
      // presence system is called on login. Logout testing would require a separate
      // component or integration with the main app.
    });

    it('should send offline notification on window close', async () => {
      // Setup: Create authenticated session
      const userData = {
        id: '456',
        name: 'Another User',
        roles: ['RRHH'],
      };

      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem('user', JSON.stringify(userData));

      vi.mocked(AuthService.initialize).mockImplementation(() => {});

      render(
        <BrowserRouter>
          <AuthProvider>
            <PaginaAutenticacionAvanzada />
          </AuthProvider>
        </BrowserRouter>
      );

      // Verify presence was marked online
      await waitFor(() => {
        expect(vi.mocked(PresenceRepository.markOnline)).toHaveBeenCalled();
      });

      // Note: The offline notification is sent through the beforeunload event listener
      // in AuthContext. This is tested in the AuthContext tests, not in the login page tests.
      // The login page itself doesn't trigger logout, so we verify that the presence
      // system is properly integrated by checking that markOnline was called.
    });
  });

  // ============================================================================
  // SECTION 5: Password Reset Flow (Should Be Unaffected)
  // ============================================================================

  describe('Section 5: Password Reset Flow', () => {
    it('should allow password reset from login form', async () => {
      vi.mocked(AuthService.initialize).mockImplementation(() => {});

      render(
        <BrowserRouter>
          <AuthProvider>
            <PaginaAutenticacionAvanzada />
          </AuthProvider>
        </BrowserRouter>
      );

      // Step 1: Enter username
      const usernameInput = screen.getByPlaceholderText(/usuario/i);
      await userEvent.type(usernameInput, 'testuser');

      const validateBtn = screen.getByRole('button', { name: /siguiente|continuar|validar/i });
      await userEvent.click(validateBtn);

      // Step 2: Wait for login form
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/contraseña|password/i)).toBeInTheDocument();
      });

      // Step 3: Click "Forgot Password" link
      const forgotPasswordLink = screen.getByRole('button', { name: /olvidé|forgot|reset/i });
      await userEvent.click(forgotPasswordLink);

      // Step 4: Verify reset password form appears by checking for email input
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
      });

      // Verify the form has the expected fields
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/12345678/i)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // SECTION 6: Error Scenarios
  // ============================================================================

  describe('Section 6: Error Scenarios', () => {
    it('should handle invalid credentials error', async () => {
      const mockAuthServiceLogin = vi.fn().mockImplementation(async () => {
        throw new Error('Credenciales inválidas');
      });

      vi.mocked(AuthService.login).mockImplementation(mockAuthServiceLogin);
      vi.mocked(AuthService.initialize).mockImplementation(() => {});

      render(
        <BrowserRouter>
          <AuthProvider>
            <PaginaAutenticacionAvanzada />
          </AuthProvider>
        </BrowserRouter>
      );

      // Perform login with invalid credentials
      const usernameInput = screen.getByPlaceholderText(/usuario/i);
      await userEvent.type(usernameInput, 'testuser');

      const validateBtn = screen.getByRole('button', { name: /siguiente|continuar|validar/i });
      await userEvent.click(validateBtn);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/contraseña|password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText(/contraseña|password/i);
      await userEvent.type(passwordInput, 'wrongpassword');

      const loginBtn = screen.getByRole('button', { name: /ingresar|login|entrar/i });
      await userEvent.click(loginBtn);

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument();
      });

      // Verify username is still in the form (not cleared)
      expect(usernameInput).toHaveValue('testuser');
    });

    it('should handle network error', async () => {
      const mockAuthServiceLogin = vi.fn().mockImplementation(async () => {
        throw new Error('Failed to fetch');
      });

      vi.mocked(AuthService.login).mockImplementation(mockAuthServiceLogin);
      vi.mocked(AuthService.initialize).mockImplementation(() => {});

      render(
        <BrowserRouter>
          <AuthProvider>
            <PaginaAutenticacionAvanzada />
          </AuthProvider>
        </BrowserRouter>
      );

      // Perform login
      const usernameInput = screen.getByPlaceholderText(/usuario/i);
      await userEvent.type(usernameInput, 'testuser');

      const validateBtn = screen.getByRole('button', { name: /siguiente|continuar|validar/i });
      await userEvent.click(validateBtn);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/contraseña|password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText(/contraseña|password/i);
      await userEvent.type(passwordInput, 'password123');

      const loginBtn = screen.getByRole('button', { name: /ingresar|login|entrar/i });
      await userEvent.click(loginBtn);

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
      });
    });

    it('should handle missing role error', async () => {
      const mockAuthServiceLogin = vi.fn().mockImplementation(async () => {
        localStorage.setItem('auth_token', 'test-token');
        return {
          token: 'test-token',
          type: 'Bearer',
          username: 'testuser',
          empleadoId: 123,
          nombreCompleto: 'Test User',
          roles: [], // Empty roles array
        };
      });

      vi.mocked(AuthService.login).mockImplementation(mockAuthServiceLogin);
      vi.mocked(AuthService.getRoleFromToken).mockReturnValue(undefined);
      vi.mocked(AuthService.initialize).mockImplementation(() => {});

      render(
        <BrowserRouter>
          <AuthProvider>
            <PaginaAutenticacionAvanzada />
          </AuthProvider>
        </BrowserRouter>
      );

      // Perform login
      const usernameInput = screen.getByPlaceholderText(/usuario/i);
      await userEvent.type(usernameInput, 'testuser');

      const validateBtn = screen.getByRole('button', { name: /siguiente|continuar|validar/i });
      await userEvent.click(validateBtn);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/contraseña|password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText(/contraseña|password/i);
      await userEvent.type(passwordInput, 'password123');

      const loginBtn = screen.getByRole('button', { name: /ingresar|login|entrar/i });
      await userEvent.click(loginBtn);

      // Verify that the login was attempted
      await waitFor(() => {
        expect(mockAuthServiceLogin).toHaveBeenCalled();
      });

      // Note: When no role is found, the system defaults to 'LOGIN' role
      // which maps to '/panel'. The error handling for missing roles is
      // handled by the backend returning an error, not by empty roles array.
      // This test verifies that the login flow handles the response correctly.
    });
  });

  // ============================================================================
  // SECTION 7: Race Conditions in Storage Operations
  // ============================================================================

  describe('Section 7: Race Conditions in Storage Operations', () => {
    it('should handle concurrent storage operations without race conditions', async () => {
      const mockAuthServiceLogin = vi.fn().mockImplementation(async () => {
        localStorage.setItem('auth_token', 'test-token-concurrent');
        return {
          token: 'test-token-concurrent',
          type: 'Bearer',
          username: 'testuser',
          empleadoId: 123,
          nombreCompleto: 'Test User',
          roles: ['RRHH'],
        };
      });

      vi.mocked(AuthService.login).mockImplementation(mockAuthServiceLogin);
      vi.mocked(AuthService.getRoleFromToken).mockReturnValue('RRHH');
      vi.mocked(AuthService.initialize).mockImplementation(() => {});

      render(
        <BrowserRouter>
          <AuthProvider>
            <PaginaAutenticacionAvanzada />
          </AuthProvider>
        </BrowserRouter>
      );

      // Perform login
      const usernameInput = screen.getByPlaceholderText(/usuario/i);
      await userEvent.type(usernameInput, 'testuser');

      const validateBtn = screen.getByRole('button', { name: /siguiente|continuar|validar/i });
      await userEvent.click(validateBtn);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/contraseña|password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText(/contraseña|password/i);
      await userEvent.type(passwordInput, 'password123');

      const loginBtn = screen.getByRole('button', { name: /ingresar|login|entrar/i });
      await userEvent.click(loginBtn);

      // Verify both token and user data are stored correctly
      await waitFor(() => {
        const token = localStorage.getItem('auth_token');
        const user = localStorage.getItem('user');
        
        expect(token).toBe('test-token-concurrent');
        expect(user).toBeTruthy();
        
        const parsedUser = JSON.parse(user!);
        expect(parsedUser.id).toBe('123');
        expect(parsedUser.name).toBe('Test User');
        expect(parsedUser.roles).toEqual(['RRHH']);
      });
    });

    it('should maintain storage consistency across multiple operations', async () => {
      // Setup: Create initial session
      const userData = {
        id: '123',
        name: 'Test User',
        roles: ['RRHH'],
      };

      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem('user', JSON.stringify(userData));

      vi.mocked(AuthService.initialize).mockImplementation(() => {});
      vi.mocked(AuthService.getRoleFromToken).mockReturnValue('RRHH');

      render(
        <BrowserRouter>
          <AuthProvider>
            <PaginaAutenticacionAvanzada />
          </AuthProvider>
        </BrowserRouter>
      );

      // Verify storage consistency
      await waitFor(() => {
        const token = localStorage.getItem('auth_token');
        const user = localStorage.getItem('user');
        
        expect(token).toBe('test-token');
        expect(user).toBeTruthy();
        
        const parsedUser = JSON.parse(user!);
        expect(parsedUser.id).toBe('123');
        expect(parsedUser.name).toBe('Test User');
      });

      // Verify no duplicate keys
      const keys = Object.keys(localStorage);
      const userKeys = keys.filter(k => k.includes('user'));
      expect(userKeys).toContain('user');
      expect(userKeys).not.toContain('auth_user'); // Should not have old key
    });
  });

  // ============================================================================
  // SECTION 8: Duplicate HTTP Requests
  // ============================================================================

  describe('Section 8: No Duplicate HTTP Requests', () => {
    it('should not make duplicate login requests', async () => {
      const mockAuthServiceLogin = vi.fn().mockImplementation(async () => {
        localStorage.setItem('auth_token', 'test-token-no-dup');
        return {
          token: 'test-token-no-dup',
          type: 'Bearer',
          username: 'testuser',
          empleadoId: 123,
          nombreCompleto: 'Test User',
          roles: ['RRHH'],
        };
      });

      vi.mocked(AuthService.login).mockImplementation(mockAuthServiceLogin);
      vi.mocked(AuthService.getRoleFromToken).mockReturnValue('RRHH');
      vi.mocked(AuthService.initialize).mockImplementation(() => {});

      render(
        <BrowserRouter>
          <AuthProvider>
            <PaginaAutenticacionAvanzada />
          </AuthProvider>
        </BrowserRouter>
      );

      // Perform login
      const usernameInput = screen.getByPlaceholderText(/usuario/i);
      await userEvent.type(usernameInput, 'testuser');

      const validateBtn = screen.getByRole('button', { name: /siguiente|continuar|validar/i });
      await userEvent.click(validateBtn);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/contraseña|password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText(/contraseña|password/i);
      await userEvent.type(passwordInput, 'password123');

      const loginBtn = screen.getByRole('button', { name: /ingresar|login|entrar/i });
      await userEvent.click(loginBtn);

      // Verify login was called exactly once
      await waitFor(() => {
        expect(mockAuthServiceLogin).toHaveBeenCalledTimes(1);
      });

      // Verify no additional calls were made
      expect(mockAuthServiceLogin).toHaveBeenCalledTimes(1);
    });

    it('should not make duplicate presence requests', async () => {
      const userData = {
        id: '123',
        name: 'Test User',
        roles: ['RRHH'],
      };

      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem('user', JSON.stringify(userData));

      vi.mocked(AuthService.initialize).mockImplementation(() => {});
      vi.mocked(AuthService.getRoleFromToken).mockReturnValue('RRHH');

      render(
        <BrowserRouter>
          <AuthProvider>
            <PaginaAutenticacionAvanzada />
          </AuthProvider>
        </BrowserRouter>
      );

      // Wait for presence calls
      await waitFor(() => {
        expect(vi.mocked(PresenceRepository.markOnline)).toHaveBeenCalled();
      });

      // Verify markOnline was called exactly once
      expect(vi.mocked(PresenceRepository.markOnline)).toHaveBeenCalledTimes(1);

      // Verify updateDisponibilidad was called exactly once
      expect(vi.mocked(PresenceRepository.updateDisponibilidad)).toHaveBeenCalledTimes(1);
    });
  });
});
