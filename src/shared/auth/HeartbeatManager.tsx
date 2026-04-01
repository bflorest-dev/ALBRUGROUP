import React from 'react';
import { useHeartbeat } from '@shared/hooks/useHeartbeat';

/**
 * Componente gestor de heartbeat
 * 
 * Activa automáticamente el envío de heartbeat cada 45 segundos
 * para mantener la sesión activa en Redis.
 * 
 * Debe ser hijo directo de AuthProvider para que useHeartbeat()
 * tenga acceso al contexto de autenticación.
 */
export const HeartbeatManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Activar heartbeat automático
  useHeartbeat();

  return <>{children}</>;
};
