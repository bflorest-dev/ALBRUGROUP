import React, { createContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { User } from './types';
import { AuthService } from '@entidades/auth/model';
import { PresenceRepository } from '@shared/api';

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

  // Trackear usuario anterior para detectar transiciones (login vs logout)
  const prevUserRef = useRef<User | null>(null);

  useEffect(() => {
    AuthService.initialize();
  }, []);

  /**
   * Sincronizar presencia con servidor cuando el usuario se autentica/desautentica
   * 
   * Casos manejados:
   * 1. Login exitoso: currentUser = null → {user} → markOnline() + updateDisponibilidad()
   * 2. Recarga de página: currentUser del localStorage → markOnline() + updateDisponibilidad()
   * 3. Logout: currentUser = {user} → null → markOffline() (en el método logout())
   * 4. Desmontaje: Si se desmonta con usuario activo, marcar offline
   * 
   * IMPORTANTE: El cleanup aquí NUNCA se ejecuta durante login porque
   * solo lo disparamos cuando pasamos de user → null (logout), no null → user.
   * 
   * Manejo de errores: Los errores se loguean pero no bloquean el acceso
   */
  useEffect(() => {
    if (!currentUser) {
      // Usuario deslogueado, no hacer nada
      prevUserRef.current = null;
      return;
    }

    console.log(`[AuthContext] 👤 Usuario autenticado: ${currentUser.name}, registrando presencia...`);

    // Flag para evitar duplicadas en cleanup
    let isActive = true;

    const registerPresence = async () => {
      try {
        // Paso 1: Marcar como online (esperar respuesta 200)
        console.log('[AuthContext] 🟢 POST /presence/online');
        await PresenceRepository.markOnline();

        if (!isActive) return; // Verificar si el componente se desmontó

        // Paso 2: Establecer disponibilidad inicial (SOLO después de confirmar online)
        console.log('[AuthContext] 🟡 PATCH /presence/disponibilidad/DISPONIBLE');
        await PresenceRepository.updateDisponibilidad('DISPONIBLE');

        console.log('[AuthContext] ✅ Presencia registrada exitosamente');
      } catch (error) {
        // Errores de presencia se loguean pero NO bloquean la aplicación
        console.warn('[AuthContext] ⚠️ Error al registrar presencia:', error);
        console.warn('[AuthContext] ⚠️ El usuario puede continuar usando la aplicación');
      }
    };

    // Guardar usuario anterior para comparación
    prevUserRef.current = currentUser;

    // Ejecutar registro de presencia
    registerPresence();

    // Cleanup: Solo marcar offline cuando REALMENTE hacemos logout
    // (transición de user → null), NO en otras circunstancias
    return () => {
      isActive = false;
      // CRÍTICO: Verificar que currentUser CAMBIÓ A NULL, no solo si prevUserRef tiene valor
      // Esto evita markOffline() espurio en StrictMode o cuando currentUser no cambió
      if (prevUserRef.current && !currentUser) {
        console.log('[AuthContext] 🔴 POST /presence/offline (desde cleanup - logout real)');
        PresenceRepository.markOffline()
          .catch((err) => {
            console.warn('[AuthContext] ⚠️ Error al marcar offline en cleanup:', err);
          });
      }
    };
  }, [currentUser]);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await AuthService.login({ username: email, password });
    const user: User = {
      id: String(response.empleadoId),
      name: response.nombreCompleto,
      roles: response.roles as User['roles'],
    };
    setCurrentUser(user);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  };

  const logout = () => {
    // Notificar al servidor de presencia antes de logout
    PresenceRepository.markOffline()
      .catch((err) => {
        console.warn('[AuthContext] ⚠️ Error al notificar offline en logout:', err);
        // No bloquear el logout si presencia falla
      });

    // Cambiar currentUser a null dispara el cleanup que verifica !currentUser
    setCurrentUser(null);
    AuthService.logout();
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated: !!currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
