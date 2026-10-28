-- V23: minutos_tardanza en resumen_asistencia_mensual.
-- Suma de max(0, hora_ingreso - entrada_programada) por día tardío con marcación.
-- Los snapshots existentes quedan en 0 (conservador); se recalculan bajo demanda.
ALTER TABLE resumen_asistencia_mensual
    ADD COLUMN minutos_tardanza INTEGER NOT NULL DEFAULT 0;
