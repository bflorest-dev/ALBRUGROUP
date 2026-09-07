CREATE TABLE IF NOT EXISTS subsanacion_auditoria (
    id                                    BIGSERIAL PRIMARY KEY,
    request_id                            UUID NOT NULL,
    -- Referencia logica: el acta debe sobrevivir incluso si posteriormente se elimina el lead.
    id_lead                               BIGINT NOT NULL,
    modo                                  VARCHAR(32) NOT NULL,
    id_admin                              BIGINT NOT NULL,
    nombre_admin                          VARCHAR(255) NOT NULL,
    rol_admin                             VARCHAR(255) NOT NULL,
    fecha_gestion                         DATE NOT NULL,
    fecha_instalacion                     DATE NOT NULL,
    motivo                                VARCHAR(1000) NOT NULL,
    snapshot_anterior                     TEXT,
    snapshot_resultado                    TEXT,
    eventos_reemplazados                  INTEGER NOT NULL DEFAULT 0,
    resumenes_reemplazados                INTEGER NOT NULL DEFAULT 0,
    artefactos_postventa_reemplazados     INTEGER NOT NULL DEFAULT 0,
    oportunidades_hermanas_afectadas      INTEGER NOT NULL DEFAULT 0,
    ejecutado_at                          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_subsanacion_request_id UNIQUE (request_id)
);

CREATE INDEX IF NOT EXISTS idx_subsanacion_auditoria_lead
    ON subsanacion_auditoria (id_lead);
