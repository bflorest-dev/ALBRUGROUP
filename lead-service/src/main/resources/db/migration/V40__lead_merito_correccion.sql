CREATE TABLE lead_merito_correccion (
    id BIGSERIAL PRIMARY KEY,
    id_lead BIGINT NOT NULL,
    lead_numero VARCHAR(50) NOT NULL,
    etapa_merito VARCHAR(50) NOT NULL,
    id_asesor_anterior BIGINT NOT NULL,
    nombre_asesor_anterior VARCHAR(255) NOT NULL,
    id_asesor_nuevo BIGINT NOT NULL,
    nombre_asesor_nuevo VARCHAR(255) NOT NULL,
    id_actor BIGINT NOT NULL,
    nombre_actor VARCHAR(255) NOT NULL,
    rol_actor VARCHAR(100) NOT NULL,
    motivo VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_lead_merito_correccion_lead_etapa UNIQUE (id_lead, etapa_merito)
);

CREATE INDEX idx_lead_merito_correccion_lead
    ON lead_merito_correccion (id_lead);
