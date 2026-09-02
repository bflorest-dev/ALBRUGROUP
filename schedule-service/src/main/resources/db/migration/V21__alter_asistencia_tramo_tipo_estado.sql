-- ============================================================
-- V21: tipo_tramo + estado_tramo en asistencia_tramo
--
-- Rediseno multi-tramo: asistencia_tramo pasa de guardarse SOLO en re-ingreso (dia partido) a
-- persistir TODOS los tramos del dia al cerrar la jornada (base + extra + compensable), como foto
-- inmutable para el reporte per-tramo de dias cerrados.
--   tipo_tramo  = BASE / EXTRA / COMPENSABLE (tipo funcional del tramo).
--   estado_tramo = CUMPLIDO / EXPIRADO / ANULADO (subestado final; ANULADO = extra/comp abandonado).
-- Cambio aditivo y nullable (las filas historicas quedan sin tipo/estado; se derivan al leer si hace
-- falta). Idempotente.
-- ============================================================

ALTER TABLE asistencia_tramo
    ADD COLUMN IF NOT EXISTS tipo_tramo     VARCHAR(20),
    ADD COLUMN IF NOT EXISTS estado_tramo   VARCHAR(20),
    ADD COLUMN IF NOT EXISTS salida_forzada BOOLEAN;

-- salida_forzada distingue una marca OFFLINE REAL del empleado de un cierre forzado por
-- expiracion/reconciliacion. Alimenta la regla de nulidad de extras/compensables (cierre coherente
-- vs. abandono). Aditiva y nullable (NULL = desconocido en filas historicas; se trata como no forzada).
ALTER TABLE asistencia
    ADD COLUMN IF NOT EXISTS salida_forzada BOOLEAN;
