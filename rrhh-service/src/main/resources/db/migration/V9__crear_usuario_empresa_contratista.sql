CREATE TABLE IF NOT EXISTS usuario_empresa_contratista (
    id                      BIGSERIAL PRIMARY KEY,
    id_empleado             BIGINT NOT NULL,
    id_empresa_contratista  BIGINT NOT NULL REFERENCES empresa_contratista(id),
    activo                  BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_usuario_empresa_contratista UNIQUE (id_empleado, id_empresa_contratista)
);

CREATE INDEX IF NOT EXISTS idx_uec_empleado
    ON usuario_empresa_contratista (id_empleado);

CREATE INDEX IF NOT EXISTS idx_uec_empresa
    ON usuario_empresa_contratista (id_empresa_contratista);
