-- ============================================================
-- V2: Ampliaciones de horario
--
-- 1) excepcion_horario.creado_por: auditoria de quien registro la
--    excepcion/ampliacion (se toma del token). Nullable por filas previas.
-- 2) asistencia_tramo: archiva tramos cerrados de un mismo dia cuando una
--    jornada ya cerrada se reabre por una ampliacion (dia partido). En dias
--    normales queda vacia, asi el comportamiento previo no cambia.
--
-- El tipo AMPLIACION se agrega en el enum Java (TipoExcepcionHorario) y se
-- persiste como STRING en la columna tipo existente: no requiere DDL.
-- Cambios no destructivos.
-- ============================================================

ALTER TABLE excepcion_horario
    ADD COLUMN creado_por BIGINT;

CREATE TABLE asistencia_tramo (
    id                            BIGSERIAL PRIMARY KEY,
    asistencia_id                 BIGINT      NOT NULL REFERENCES asistencia(id),
    origen                        VARCHAR(30) NOT NULL,
    entrada_programada            TIME,
    salida_programada             TIME,
    inicio_almuerzo_programado    TIME,
    fin_almuerzo_programado       TIME,
    fecha_hora_ingreso            TIMESTAMP,
    fecha_hora_salida             TIMESTAMP,
    minutos_objetivo              INTEGER     NOT NULL DEFAULT 0,
    minutos_trabajados            INTEGER     NOT NULL DEFAULT 0,
    minutos_almuerzo_tomados      INTEGER     NOT NULL DEFAULT 0,
    minutos_servicios_acumulados  INTEGER     NOT NULL DEFAULT 0,
    motivo                        VARCHAR(300),
    creado_por                    BIGINT,
    created_at                    TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_asistencia_tramo_asistencia
    ON asistencia_tramo (asistencia_id);
