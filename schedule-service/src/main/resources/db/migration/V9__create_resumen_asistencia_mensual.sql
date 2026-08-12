-- ============================================================
-- V9: resumen_asistencia_mensual
--
-- Snapshot de cierre mensual (inmutable), creado al cerrar el mes / primer
-- acceso a un mes pasado (materializacion perezosa). Mes en curso se deriva en
-- vivo y NO tiene fila. Guarda HECHOS balanceados (sin dinero); el ms de calculo
-- aplica tarifas/descuentos sobre esto. minutos_extra / minutos_compensados en
-- minutos exactos. Cambio aditivo.
-- ============================================================

CREATE TABLE resumen_asistencia_mensual (
    id                   BIGSERIAL PRIMARY KEY,
    id_empleado          BIGINT  NOT NULL,
    anio                 INTEGER NOT NULL,
    mes                  INTEGER NOT NULL,
    fecha_cierre         TIMESTAMP WITH TIME ZONE,
    cerrado_por          BIGINT,
    dias_laborables      INTEGER NOT NULL DEFAULT 0,
    dias_presente        INTEGER NOT NULL DEFAULT 0,
    dias_tardanza        INTEGER NOT NULL DEFAULT 0,
    dias_falta           INTEGER NOT NULL DEFAULT 0,
    minutos_objetivo     INTEGER NOT NULL DEFAULT 0,
    minutos_trabajados   INTEGER NOT NULL DEFAULT 0,
    balance_final        INTEGER NOT NULL DEFAULT 0,
    minutos_extra        INTEGER NOT NULL DEFAULT 0,
    minutos_compensados  INTEGER NOT NULL DEFAULT 0,
    cantidad_tardanzas   INTEGER NOT NULL DEFAULT 0,
    created_at           TIMESTAMP WITH TIME ZONE,
    CONSTRAINT resumen_mensual_mes_check CHECK (mes BETWEEN 1 AND 12),
    CONSTRAINT uk_resumen_mensual UNIQUE (id_empleado, anio, mes)
);
