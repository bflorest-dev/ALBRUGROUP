-- ============================================================
-- V20: margen global de marcacion temprana
--
-- Todos los roles deben poder marcar ONLINE hasta 30 minutos antes
-- de su entrada. Las filas por rol pueden seguir existiendo; esta
-- migracion cambia la politica global para los roles sin override.
-- ============================================================

UPDATE parametro_asistencia
SET margen_adelanto_min = 30,
    updated_at = now()
WHERE rol IS NULL
  AND id_equipo IS NULL;

INSERT INTO parametro_asistencia (
    rol,
    id_equipo,
    margen_adelanto_min,
    tolerancia_tardanza_min,
    bloqueo_tardanza_min,
    max_minutos_pausa_activa,
    max_usos_pausa_activa_dia,
    created_at,
    updated_at
)
SELECT
    NULL,
    NULL,
    30,
    5,
    20,
    5,
    1,
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1
    FROM parametro_asistencia
    WHERE rol IS NULL
      AND id_equipo IS NULL
);
