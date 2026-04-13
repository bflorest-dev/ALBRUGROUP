import React, { createContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Role, User } from '../types';
import { AuthService } from '@entities/auth/model';
import { PresenceRepository } from '@shared/api';
import { env } from '@shared/config/env';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('auth_user') || localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const prevUserRef = useRef<User | null>(null);

  useEffect(() => {
    AuthService.initialize();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const confirmCloseSession = (event: BeforeUnloadEvent) => {
      // Browsers show a native confirmation dialog when returnValue is set.
      event.preventDefault();
      event.returnValue = '';
    };

    const sendOfflineOnClose = () => {
      const token = localStorage.getItem('auth_token');
      const endpoint = `${env.PRESENCE_BASE_URL}/offline`;

      if (token) {
        try {
          fetch(endpoint, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            keepalive: true,
          });
          return;
        } catch {
          // Fallback to repository call if keepalive fetch fails.
        }
      }

      PresenceRepository.markOffline().catch((err) => {
        console.warn('[AuthContext] ⚠️ Error al notificar offline al cerrar ventana:', err);
      });
    };

    window.addEventListener('beforeunload', confirmCloseSession);
    window.addEventListener('pagehide', sendOfflineOnClose);
    window.addEventListener('unload', sendOfflineOnClose);

    return () => {
      window.removeEventListener('beforeunload', confirmCloseSession);
      window.removeEventListener('pagehide', sendOfflineOnClose);
      window.removeEventListener('unload', sendOfflineOnClose);
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      prevUserRef.current = null;
      return;
    }

    console.log(`[AuthContext] 👤 Usuario autenticado: ${currentUser.name}, registrando presencia...`);

    let isActive = true;

    const registerPresence = async () => {
      try {
        console.log('[AuthContext] 🟢 POST /presence/online');
        await PresenceRepository.markOnline();

        if (!isActive) return;

        console.log('[AuthContext] 🟡 PATCH /presence/disponibilidad/DISPONIBLE');
        await PresenceRepository.updateDisponibilidad('DISPONIBLE');

        console.log('[AuthContext] ✅ Presencia registrada exitosamente');
      } catch (error) {
        console.warn('[AuthContext] ⚠️ Error al registrar presencia:', error);
        console.warn('[AuthContext] ⚠️ El usuario puede continuar usando la aplicación');
      }
    };

    prevUserRef.current = currentUser;
    registerPresence();

    return () => {
      isActive = false;
    };
  }, [currentUser]);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await AuthService.login({ username: email, password });
    const tokenRole = AuthService.getRoleFromToken(localStorage.getItem('auth_token') ?? '');
    const roles: Role[] = Array.isArray(response.roles) && response.roles.length > 0
      ? response.roles.map((role) => role.toUpperCase() as Role)
      : tokenRole
      ? [tokenRole.toUpperCase() as Role]
      : ['LOGIN'];

    const user: User = {
      id: String(response.empleadoId),
      name: response.nombreCompleto,
      roles,
    };
    setCurrentUser(user);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  };

  const logout = () => {
    PresenceRepository.markOffline()
      .catch((err) => {
        console.warn('[AuthContext] ⚠️ Error al notificar offline en logout:', err);
      });

    setCurrentUser(null);
    AuthService.logout();
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated: !!currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
