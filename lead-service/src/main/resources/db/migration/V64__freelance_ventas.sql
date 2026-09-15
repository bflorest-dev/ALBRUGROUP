CREATE TABLE freelance_venta_origen (
    id                  BIGSERIAL PRIMARY KEY,
    request_id          UUID NOT NULL,
    id_lead             BIGINT NOT NULL REFERENCES lead(id),
    id_freelance        BIGINT NOT NULL,
    nombre_freelance    VARCHAR(255) NOT NULL,
    id_equipo_origen    BIGINT NOT NULL,
    creado_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_freelance_venta_request UNIQUE (request_id),
    CONSTRAINT uk_freelance_venta_lead UNIQUE (id_lead)
);

CREATE INDEX idx_freelance_venta_usuario_fecha
    ON freelance_venta_origen (id_freelance, creado_at);

CREATE TABLE freelance_venta_reenvio (
    id                  BIGSERIAL PRIMARY KEY,
    request_id          UUID NOT NULL,
    id_origen           BIGINT NOT NULL REFERENCES freelance_venta_origen(id),
    numero_intento      INTEGER NOT NULL,
    creado_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_freelance_reenvio_request UNIQUE (request_id),
    CONSTRAINT uk_freelance_reenvio_intento UNIQUE (id_origen, numero_intento)
);
