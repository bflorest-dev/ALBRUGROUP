-- Metadata historica por etapa del lead (una fila por (id_lead, etapa)).
-- Separa los puntos historicos (primera/ultima/mayor rango de tipificacion, merito y ultimo gestor
-- por etapa) del estado operativo vivo del lead. Se llena hacia adelante desde los hooks de
-- registro/asignacion/tipificacion/avance; el backfill historico va en una migracion/job aparte.

CREATE TABLE IF NOT EXISTS lead_etapa_resumen (
    id                                BIGSERIAL PRIMARY KEY,
    id_lead                           BIGINT NOT NULL,
    etapa                             VARCHAR(32) NOT NULL,

    fecha_ingreso_etapa               TIMESTAMP WITH TIME ZONE,
    fecha_salida_etapa                TIMESTAMP WITH TIME ZONE,
    numero_pasadas                    INTEGER NOT NULL DEFAULT 1,
    total_tipificaciones              INTEGER NOT NULL DEFAULT 0,
    total_asignaciones                INTEGER NOT NULL DEFAULT 0,

    primera_codigo_tipificacion       VARCHAR(255),
    primera_codigo_subtipificacion    VARCHAR(255),
    primera_tipificacion_at           TIMESTAMP WITH TIME ZONE,

    ultima_codigo_tipificacion        VARCHAR(255),
    ultima_codigo_subtipificacion     VARCHAR(255),
    ultima_tipificacion_orden         INTEGER,
    ultima_tipificacion_at            TIMESTAMP WITH TIME ZONE,

    mayor_rango_codigo_tipificacion   VARCHAR(255),
    mayor_rango_codigo_subtipificacion VARCHAR(255),
    mayor_rango_orden                 INTEGER,
    mayor_rango_at                    TIMESTAMP WITH TIME ZONE,

    id_asesor_merito                  BIGINT,
    nombre_asesor_merito              VARCHAR(255),
    fecha_merito                      TIMESTAMP WITH TIME ZONE,
    id_asesor_ultima_gestion          BIGINT,
    nombre_asesor_ultima_gestion      VARCHAR(255),
    fecha_ultima_gestion              TIMESTAMP WITH TIME ZONE,

    created_at                        TIMESTAMP WITH TIME ZONE,
    updated_at                        TIMESTAMP WITH TIME ZONE,

    CONSTRAINT uk_lead_etapa UNIQUE (id_lead, etapa)
);

CREATE INDEX IF NOT EXISTS idx_lead_etapa_resumen_lead  ON lead_etapa_resumen (id_lead);
CREATE INDEX IF NOT EXISTS idx_lead_etapa_resumen_etapa ON lead_etapa_resumen (etapa);
