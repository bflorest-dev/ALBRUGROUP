-- Grupo de gasto (secciones visuales del resumen)
CREATE TABLE grupo_gasto (
    id          BIGSERIAL PRIMARY KEY,
    nombre      VARCHAR(100)  NOT NULL,
    orden       INT           NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_grupo_gasto_nombre UNIQUE (nombre)
);

-- Tipo de gasto
CREATE TABLE tipo_gasto (
    id              BIGSERIAL PRIMARY KEY,
    id_grupo_gasto  BIGINT       NOT NULL REFERENCES grupo_gasto(id),
    nombre          VARCHAR(150) NOT NULL,
    categoria       VARCHAR(20)  NOT NULL,
    activo          BOOLEAN      NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_tipo_gasto_nombre UNIQUE (nombre),
    CONSTRAINT chk_tipo_gasto_categoria CHECK (categoria IN ('FIJO', 'VARIABLE'))
);

-- Gasto individual
CREATE TABLE gasto (
    id              BIGSERIAL PRIMARY KEY,
    id_tipo_gasto   BIGINT        NOT NULL REFERENCES tipo_gasto(id),
    monto           NUMERIC(12,2) NOT NULL,
    documento       VARCHAR(100),
    descripcion     VARCHAR(500),
    fecha           DATE          NOT NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE INDEX idx_gasto_tipo_fecha ON gasto(id_tipo_gasto, fecha);
