/**
 * useHeartbeat - Hook para enviar señales de presencia periódicas (heartbeat)
 *
 * Envía POST /presence/heartbeat cada intervalo de tiempo para mantener la sesión activa.
 * Útil para mantener usuarios conectados en el sistema de presencia.
 */

import { useEffect, useRef } from 'react';
import { PresenceRepository } from '@shared/api';

interface UseHeartbeatOptions {
  interval?: number; // Intervalo en ms (default: 30000 = 30s)
  enabled?: boolean; // Habilitar/deshabilitar el heartbeat (default: true)
}

export const useHeartbeat = (options: UseHeartbeatOptions = {}) => {
  const { interval = 30000, enabled = true } = options;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const sendHeartbeat = async () => {
      try {
        await PresenceRepository.heartbeat();
      } catch (error) {
        console.error('[useHeartbeat] Error sending heartbeat:', error);
        // Podrías agregar lógica adicional aquí, como notificar al usuario o reintentar
      }
    };

    // Enviar heartbeat inmediatamente al montar
    sendHeartbeat();

    // Configurar intervalo para envíos periódicos
    intervalRef.current = setInterval(sendHeartbeat, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval, enabled]);

  return {};
};