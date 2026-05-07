import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, AuthContext } from '../AuthContext';
import { AuthService } from '@entities/auth/model/auth.service';
import { PresenceRepository } from '@shared/api';
import type { User } from '@entities/auth/types';

// Mock dependencies
vi.mock('@entities/auth/model/auth.service');
vi.mock('@shared/api', () => ({
  PresenceRepository: {
    markOnline: vi.fn().mockResolvedValue(undefined),
    updateDisponibilidad: vi.fn().mockResolvedValue(undefined),
    markOffline: vi.fn().mockResolvedValue(undefined),
  },
}));

/**
 * Task 1.6: Test session storage structure mismatch
 * 
 * **Validates: Requirements 2.7, 2.8, 2.9, 2.10**
 * 
 * WHEN `AuthService.login()` saves session data with `{username, empleadoId, nombreCompleto, roles}` structure
 * THEN `getStoredAuthenticatedUser()` should successfully read and validate the data
 * 
 * After Phase 2.1 fix:
 * - AuthContext.login() saves data as {id, name, roles}
 * - getStoredAuthenticatedUser() successfully reads this structure
 * - Session restoration works correctly
 */
describe('AuthContext - Session Storage Structure (Task 1.6)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should save session data with consistent {id, name, roles} structure', async () => {
    // Mock AuthService.login to return a response
    const mockResponse = {
      token: 'test-token-123',
      type: 'Bearer',
      username: 'testuser',
      empleadoId: 456,
      nombreCompleto: 'Test User',
      roles: ['RRHH'],
    };

    vi.mocked(AuthService.login).mockResolvedValue(mockResponse);
    vi.mocked(AuthService.getRoleFromToken).mockReturnValue('RRHH');
    vi.mocked(AuthService.initialize).mockImplementation(() => {});

    // Create a test component that uses AuthContext
    const TestComponent = () => {
      const auth = React.useContext(AuthContext);
      return (
        <div>
          {auth?.currentUser ? (
            <div>
              <div data-testid="user-id">{auth.currentUser.id}</div>
              <div data-testid="user-name">{auth.currentUser.name}</div>
              <div data-testid="user-roles">{auth.currentUser.roles.join(',')}</div>
            </div>
          ) : (
            <div data-testid="no-user">No user</div>
          )}
          <button
            onClick={async () => {
              await auth?.login('testuser', 'password123');
            }}
            data-testid="login-btn"
          >
            Login
          </button>
        </div>
      );
    };

    const { rerender } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Click login button
    const loginBtn = screen.getByTestId('login-btn');
    await userEvent.click(loginBtn);

    // Wait for login to complete
    await waitFor(() => {
      expect(screen.queryByTestId('user-id')).toBeInTheDocument();
    });

    // Verify the stored data structure
    const storedData = localStorage.getItem('user');
    expect(storedData).toBeTruthy();

    const parsed = JSON.parse(storedData!);
    
    // After fix: should have {id, name, roles} structure
    expect(parsed).toHaveProperty('id');
    expect(parsed).toHaveProperty('name');
    expect(parsed).toHaveProperty('roles');
    expect(typeof parsed.id).toBe('string');
    expect(typeof parsed.name).toBe('string');
    expect(Array.isArray(parsed.roles)).toBe(true);

    // Verify values match
    expect(parsed.id).toBe('456'); // empleadoId converted to string
    expect(parsed.name).toBe('Test User'); // nombreCompleto
    expect(parsed.roles).toEqual(['RRHH']);
  });

  it('should NOT save data with old {empleadoId, nombreCompleto} structure', async () => {
    // This test verifies that the old buggy structure is NOT used
    const mockResponse = {
      token: 'test-token-123',
      type: 'Bearer',
      username: 'testuser',
      empleadoId: 456,
      nombreCompleto: 'Test User',
      roles: ['RRHH'],
    };

    vi.mocked(AuthService.login).mockResolvedValue(mockResponse);
    vi.mocked(AuthService.getRoleFromToken).mockReturnValue('RRHH');
    vi.mocked(AuthService.initialize).mockImplementation(() => {});

    const TestComponent = () => {
      const auth = React.useContext(AuthContext);
      return (
        <button
          onClick={async () => {
            await auth?.login('testuser', 'password123');
          }}
          data-testid="login-btn"
        >
          Login
        </button>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginBtn = screen.getByTestId('login-btn');
    await userEvent.click(loginBtn);

    await waitFor(() => {
      const storedData = localStorage.getItem('user');
      expect(storedData).toBeTruthy();
    });

    const storedData = localStorage.getItem('user');
    const parsed = JSON.parse(storedData!);

    // After fix: should NOT have old structure keys
    expect(parsed).not.toHaveProperty('empleadoId');
    expect(parsed).not.toHaveProperty('nombreCompleto');
    expect(parsed).not.toHaveProperty('username');
  });
});

/**
 * Task 1.7: Test session restoration failure after page reload
 * 
 * **Validates: Requirements 2.7, 2.8, 2.9, 2.10**
 * 
 * WHEN a user reloads the page after successful login
 * THEN the system SHALL successfully restore the authenticated session
 * 
 * After Phase 2.1 fix:
 * - Session data is stored with consistent {id, name, roles} structure
 * - getStoredAuthenticatedUser() successfully reads and validates this data
 * - Page reload restores the authenticated session
 */
describe('AuthContext - Session Restoration After Page Reload (Task 1.7)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should restore authenticated session after page reload', async () => {
    // Step 1: Perform login
    const mockResponse = {
      token: 'test-token-123',
      type: 'Bearer',
      username: 'testuser',
      empleadoId: 789,
      nombreCompleto: 'John Doe',
      roles: ['RRHH'],
    };

    // Mock AuthService.login to actually set the token in localStorage
    vi.mocked(AuthService.login).mockImplementation(async () => {
      localStorage.setItem('auth_token', mockResponse.token);
      return mockResponse;
    });
    vi.mocked(AuthService.getRoleFromToken).mockReturnValue('RRHH');
    vi.mocked(AuthService.initialize).mockImplementation(() => {});

    const TestComponent = () => {
      const auth = React.useContext(AuthContext);
      return (
        <div>
          {auth?.currentUser ? (
            <div data-testid="authenticated">
              <div data-testid="user-id">{auth.currentUser.id}</div>
              <div data-testid="user-name">{auth.currentUser.name}</div>
            </div>
          ) : (
            <div data-testid="not-authenticated">Not authenticated</div>
          )}
          <button
            onClick={async () => {
              await auth?.login('testuser', 'password123');
            }}
            data-testid="login-btn"
          >
            Login
          </button>
        </div>
      );
    };

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Click login button
    const loginBtn = screen.getByTestId('login-btn');
    await userEvent.click(loginBtn);

    // Wait for login to complete
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toBeInTheDocument();
    });

    // Verify user is authenticated
    expect(screen.getByTestId('user-id')).toHaveTextContent('789');
    expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');

    // Step 2: Verify data is stored in localStorage
    const storedUser = localStorage.getItem('user');
    expect(storedUser).toBeTruthy();
    const parsedUser = JSON.parse(storedUser!);
    expect(parsedUser.id).toBe('789');
    expect(parsedUser.name).toBe('John Doe');

    // Verify token is stored
    const storedToken = localStorage.getItem('auth_token');
    expect(storedToken).toBe('test-token-123');

    // Step 3: Simulate page reload by unmounting and remounting
    unmount();

    // Step 4: Remount component (simulating page reload)
    // The stored data should still be in localStorage
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Step 5: Verify session is restored
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toBeInTheDocument();
    });

    expect(screen.getByTestId('user-id')).toHaveTextContent('789');
    expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
  });

  it('should restore session with multiple roles', async () => {
    // Test with multiple roles to ensure consistency
    const mockResponse = {
      token: 'test-token-456',
      type: 'Bearer',
      username: 'supervisor',
      empleadoId: 999,
      nombreCompleto: 'Jane Smith',
      roles: ['SUPERVISOR_VENTAS', 'RRHH'],
    };

    // Mock AuthService.login to actually set the token in localStorage
    vi.mocked(AuthService.login).mockImplementation(async () => {
      localStorage.setItem('auth_token', mockResponse.token);
      return mockResponse;
    });
    vi.mocked(AuthService.getRoleFromToken).mockReturnValue('SUPERVISOR_VENTAS');
    vi.mocked(AuthService.initialize).mockImplementation(() => {});

    const TestComponent = () => {
      const auth = React.useContext(AuthContext);
      return (
        <div>
          {auth?.currentUser ? (
            <div data-testid="authenticated">
              <div data-testid="user-roles">{auth.currentUser.roles.join(',')}</div>
            </div>
          ) : (
            <div data-testid="not-authenticated">Not authenticated</div>
          )}
          <button
            onClick={async () => {
              await auth?.login('supervisor', 'password123');
            }}
            data-testid="login-btn"
          >
            Login
          </button>
        </div>
      );
    };

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginBtn = screen.getByTestId('login-btn');
    await userEvent.click(loginBtn);

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toBeInTheDocument();
    });

    // Verify roles are stored
    expect(screen.getByTestId('user-roles')).toHaveTextContent('SUPERVISOR_VENTAS,RRHH');

    // Verify data is stored in localStorage
    const storedUser = localStorage.getItem('user');
    expect(storedUser).toBeTruthy();
    const parsedUser = JSON.parse(storedUser!);
    expect(parsedUser.roles).toEqual(['SUPERVISOR_VENTAS', 'RRHH']);

    // Verify token is stored
    const storedToken = localStorage.getItem('auth_token');
    expect(storedToken).toBe('test-token-456');

    // Simulate page reload
    unmount();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Verify roles are restored
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toBeInTheDocument();
    });

    expect(screen.getByTestId('user-roles')).toHaveTextContent('SUPERVISOR_VENTAS,RRHH');
  });

  it('should clear session when token is missing', async () => {
    // Manually set invalid session data (missing token)
    localStorage.setItem('user', JSON.stringify({
      id: '123',
      name: 'Test User',
      roles: ['RRHH'],
    }));
    // Don't set token

    vi.mocked(AuthService.initialize).mockImplementation(() => {});

    const TestComponent = () => {
      const auth = React.useContext(AuthContext);
      return (
        <div>
          {auth?.currentUser ? (
            <div data-testid="authenticated">Authenticated</div>
          ) : (
            <div data-testid="not-authenticated">Not authenticated</div>
          )}
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Should not be authenticated because token is missing
    await waitFor(() => {
      expect(screen.getByTestId('not-authenticated')).toBeInTheDocument();
    });
  });
});

// Import React for JSX
import React from 'react';
