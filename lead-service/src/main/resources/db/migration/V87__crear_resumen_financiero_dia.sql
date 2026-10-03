CREATE TABLE resumen_financiero_dia (
    id              BIGSERIAL PRIMARY KEY,
    fecha           DATE        NOT NULL,
    id_proveedor    BIGINT      NOT NULL REFERENCES proveedor(id),
    cta_bancaria    NUMERIC(12,2) NOT NULL DEFAULT 0,
    cta_publicitaria NUMERIC(12,2) NOT NULL DEFAULT 0,
    calculado_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (fecha, id_proveedor)
);

CREATE TABLE resumen_financiero_dia_zona (
    id              BIGSERIAL PRIMARY KEY,
    id_resumen_dia  BIGINT      NOT NULL REFERENCES resumen_financiero_dia(id) ON DELETE CASCADE,
    id_zona         BIGINT      NOT NULL REFERENCES zona(id),
    ingresadas      INT         NOT NULL DEFAULT 0,
    instaladas      INT         NOT NULL DEFAULT 0,
    cf_instaladas   NUMERIC(12,2) NOT NULL DEFAULT 0,
    UNIQUE (id_resumen_dia, id_zona)
);

CREATE INDEX idx_resumen_fin_dia_proveedor_fecha ON resumen_financiero_dia (id_proveedor, fecha);
