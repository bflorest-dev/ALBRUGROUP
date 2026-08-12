-- ============================================================
-- V6: parametro_asistencia
--
-- Reglas de comportamiento editables, resueltas por precedencia:
--   (rol, id_equipo) > (rol) > global (null, null).
-- Incluye margenes de adelanto, tolerancia/bloqueo de tardanza y pausa activa.
-- No incluye politica de descuentos (eso vive en el ms de calculo).
-- Cambio aditivo.
-- ============================================================

CREATE TABLE parametro_asistencia (
    id                        BIGSERIAL PRIMARY KEY,
    rol                       VARCHAR(50),
    id_equipo                 BIGINT,
    margen_adelanto_min       INTEGER,
    tolerancia_tardanza_min   INTEGER,
    bloqueo_tardanza_min      INTEGER,
    max_minutos_pausa_activa  INTEGER,
    max_usos_pausa_activa_dia INTEGER,
    created_at                TIMESTAMP WITH TIME ZONE,
    updated_at                TIMESTAMP WITH TIME ZONE
);

-- Unicidad por (rol, equipo) tratando NULL como valor concreto
CREATE UNIQUE INDEX uk_parametro_asistencia_rol_equipo
    ON parametro_asistencia (COALESCE(rol, ''), COALESCE(id_equipo, 0));
