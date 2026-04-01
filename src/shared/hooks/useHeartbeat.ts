import { useEffect } from 'react';
import { useAuth } from '@shared/auth/useAuth';
import { PresenceRepository } from '@shared/api';

/**
 * Hook personalizado para mantener el heartbeat de presencia
 * 
 * Envía un ping al servidor cada 45 segundos mientras el usuario esté autenticado.
 * Esto mantiene la sesión activa en Redis y confirma que el usuario sigue conectado.
 * 
 * Ventajas:
 * - Evita timeout de sesión en Redis
 * - Confirma que la conexión sigue activa
 * - Se limpia automáticamente al desautentica
 * 
 * Uso: useHeartbeat() en cualquier componente que esté dentro de AuthProvider
 */
export const useHeartbeat = () => {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      // Usuario no autenticado, no enviar heartbeat
      return;
    }

    console.log('[useHeartbeat] ♥️ Iniciando heartbeat para usuario:', currentUser.name);

    /**
     * Intervalo de heartbeat: 45 segundos
     * Se dispara cada 45s mientras el usuario esté autenticado
     */
    const HEARTBEAT_INTERVAL = 45 * 1000; // 45 segundos en milisegundos

    const sendHeartbeat = async () => {
      try {
        console.log('[useHeartbeat] 💓 Enviando heartbeat...');
        await PresenceRepository.heartbeat();
        console.log('[useHeartbeat] ✅ Heartbeat enviado exitosamente');
      } catch (error) {
        // Los errores de heartbeat se loguean pero NO bloquean la aplicación
        console.warn('[useHeartbeat] ⚠️ Error al enviar heartbeat:', error);
        // Si el usuario fue desautenticado (401), la sesión se limpiará automáticamente
      }
    };

    // Enviar heartbeat inmediatamente al autenticarse (opcional, mejora respuesta)
    // sendHeartbeat();

    // Configurar intervalo para enviar heartbeat cada 45 segundos
    const heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Cleanup: detener heartbeat cuando el usuario se desautentica o el componente se desmonta
    return () => {
      console.log('[useHeartbeat] 🛑 Deteniendo heartbeat');
      clearInterval(heartbeatInterval);
    };
  }, [currentUser]);
};
