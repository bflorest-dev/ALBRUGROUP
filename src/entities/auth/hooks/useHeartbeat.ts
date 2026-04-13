import { useEffect } from 'react';
import { useAuth } from '@entities/auth';
import { PresenceRepository } from '@shared/api';

export const useHeartbeat = () => {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    console.log('[useHeartbeat] ♥️ Iniciando heartbeat para usuario:', currentUser.name);

    const HEARTBEAT_INTERVAL = 45 * 1000;

    const sendHeartbeat = async () => {
      try {
        console.log('[useHeartbeat] 💓 Enviando heartbeat...');
        await PresenceRepository.heartbeat();
        console.log('[useHeartbeat] ✅ Heartbeat enviado exitosamente');
      } catch (error) {
        console.warn('[useHeartbeat] ⚠️ Error al enviar heartbeat:', error);
      }
    };

    const heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    return () => {
      console.log('[useHeartbeat] 🛑 Deteniendo heartbeat');
      clearInterval(heartbeatInterval);
    };
  }, [currentUser]);
};
