-- Regla operativa: una campaña inactiva no puede pertenecer a un equipo.
-- La reactivación la devuelve al pool y requiere una nueva asignación explícita.
DELETE FROM equipo_campana ec
USING campana c
WHERE c.id = ec.id_campana
  AND c.activo = FALSE;
