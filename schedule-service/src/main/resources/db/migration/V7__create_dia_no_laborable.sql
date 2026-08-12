-- ============================================================
-- V7: dia_no_laborable
--
-- Override de calendario con alcance. Resolucion: el mas angosto que aplique
-- (empleado > equipo > global). laborable=false => libre; laborable=true =>
-- override "si trabaja" (p. ej. un equipo que labora un feriado global).
-- No cuenta como FALTA ni afecta balance cuando es libre.
-- Cambio aditivo.
-- ============================================================

CREATE TABLE dia_no_laborable (
    id          BIGSERIAL PRIMARY KEY,
    alcance     VARCHAR(20)  NOT NULL,
    ref_id      BIGINT,
    fecha       DATE         NOT NULL,
    laborable   BOOLEAN      NOT NULL DEFAULT FALSE,
    tipo        VARCHAR(30)  NOT NULL,
    motivo      VARCHAR(300),
    creado_por  BIGINT,
    created_at  TIMESTAMP WITH TIME ZONE,
    CONSTRAINT dia_no_laborable_alcance_check
        CHECK (alcance IN ('GLOBAL', 'EQUIPO', 'EMPLEADO')),
    CONSTRAINT dia_no_laborable_ref_check
        CHECK ((alcance = 'GLOBAL' AND ref_id IS NULL)
            OR (alcance <> 'GLOBAL' AND ref_id IS NOT NULL))
);

CREATE INDEX idx_dia_no_laborable_fecha
    ON dia_no_laborable (fecha);

CREATE UNIQUE INDEX uk_dia_no_laborable
    ON dia_no_laborable (alcance, COALESCE(ref_id, 0), fecha);
