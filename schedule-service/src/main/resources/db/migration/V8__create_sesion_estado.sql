-- ============================================================
-- V8: sesion_estado
--
-- Sub-estados repetibles cronometrados (SERVICIOS, PAUSA_ACTIVA, CAPACITACION).
-- Una fila por uso; los totales y topes se DERIVAN por suma (no acumulador).
-- Sesion en curso = fin IS NULL. creado_por: quien activo (CAPACITACION).
-- Cambio aditivo.
-- ============================================================

CREATE TABLE sesion_estado (
    id            BIGSERIAL PRIMARY KEY,
    asistencia_id BIGINT      NOT NULL REFERENCES asistencia(id),
    tipo          VARCHAR(20) NOT NULL,
    inicio        TIMESTAMP   NOT NULL,
    fin           TIMESTAMP,
    creado_por    BIGINT,
    created_at    TIMESTAMP WITH TIME ZONE,
    CONSTRAINT sesion_estado_tipo_check
        CHECK (tipo IN ('SERVICIOS', 'PAUSA_ACTIVA', 'CAPACITACION')),
    CONSTRAINT sesion_estado_rango_check
        CHECK (fin IS NULL OR fin >= inicio)
);

CREATE INDEX idx_sesion_estado_asistencia
    ON sesion_estado (asistencia_id);
