-- ============================================================
-- V15: desglose de tardanzas en resumen_asistencia_mensual
--
-- El resumen es el UNICO artefacto de hand-off al ms de calculo (API/evento, no DB
-- compartida). Para que ese ms decida penalizaciones por status necesita distinguir la
-- tardanza cruda de la compensada (corrimiento SUP/ADMIN) y la justificada (RRHH). Se
-- agregan como sub-conteos de dias_tardanza (compensada + justificada <= dias_tardanza).
-- Cambio aditivo (nullable con DEFAULT 0); los snapshots nuevos siempre las setean.
-- ============================================================

ALTER TABLE resumen_asistencia_mensual
    ADD COLUMN dias_tardanza_compensada  INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN dias_tardanza_justificada INTEGER NOT NULL DEFAULT 0;
