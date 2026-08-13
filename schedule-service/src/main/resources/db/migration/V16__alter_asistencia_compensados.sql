-- ============================================================
-- V16: minutos_compensados en asistencia
--
-- Compensacion de horas (razon COMPENSACION, Fase 3.4.b): tramo aditivo fuera del base cuyo
-- tiempo trabajado NEUTRALIZA el deficit del mes (no va a horas extra ni al balance del dia).
-- Se guarda por dia, separado de minutos_trabajados y minutos_extra; el resumen mensual lo
-- suma (topado al deficit) para acercar el balance del mes a 0. Cambio aditivo (DEFAULT 0).
-- ============================================================

ALTER TABLE asistencia
    ADD COLUMN minutos_compensados INTEGER NOT NULL DEFAULT 0;
