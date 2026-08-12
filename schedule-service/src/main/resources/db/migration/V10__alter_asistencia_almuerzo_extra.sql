-- ============================================================
-- V10: asistencia - split de almuerzo + minutos extra
--
-- Separa el ESTADO de almuerzo de la MARCACION REAL (contador):
--   almuerzo_estado_desde  = cuando entro al estado (manual/forzado)
--   almuerzo_real_inicio/fin = consumo real (arranca al vaciar bandeja)
--   origen_almuerzo        = MANUAL | FORZADO
-- minutos_extra: tiempo extra autorizado (>=0), separado del balance.
--
-- Aditivo: las columnas viejas (fecha_hora_inicio/fin_almuerzo, minutos_servicios_*)
-- se conservan durante la transicion; se dropean en la fase de limpieza.
-- ============================================================

ALTER TABLE asistencia
    ADD COLUMN almuerzo_estado_desde TIMESTAMP,
    ADD COLUMN almuerzo_real_inicio  TIMESTAMP,
    ADD COLUMN almuerzo_real_fin     TIMESTAMP,
    ADD COLUMN origen_almuerzo       VARCHAR(20),
    ADD COLUMN minutos_extra         INTEGER NOT NULL DEFAULT 0;

ALTER TABLE asistencia
    ADD CONSTRAINT asistencia_origen_almuerzo_check
        CHECK (origen_almuerzo IS NULL OR origen_almuerzo IN ('MANUAL', 'FORZADO'));
