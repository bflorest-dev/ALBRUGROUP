-- ============================================================
-- V19: margen de marcacion temprana para COMMUNITY
--
-- COMMUNITY marca asistencia como rol operativo, pero necesita el mismo margen
-- temprano que GTR: puede marcar ingreso hasta 30 minutos antes de su entrada.
-- Solo se define el margen; el resto de parametros hereda de la fila global.
-- ============================================================

UPDATE parametro_asistencia
SET margen_adelanto_min = 30,
    updated_at = now()
WHERE rol = 'COMMUNITY'
  AND id_equipo IS NULL;

INSERT INTO parametro_asistencia (rol, id_equipo, margen_adelanto_min, created_at, updated_at)
SELECT 'COMMUNITY', NULL, 30, now(), now()
WHERE NOT EXISTS (
    SELECT 1
    FROM parametro_asistencia
    WHERE rol = 'COMMUNITY'
      AND id_equipo IS NULL
);
