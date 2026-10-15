-- Fase 1: Nueva tabla de cashback por periodo
CREATE TABLE promocion_cashback_periodo (
    id                      BIGSERIAL PRIMARY KEY,
    id_promocion_comercial  BIGINT NOT NULL REFERENCES promocion_comercial(id),
    numero_periodo          INTEGER NOT NULL,
    monto                   NUMERIC(10,2) NOT NULL
);

ALTER TABLE promocion_cashback_periodo
    ADD CONSTRAINT uq_promo_cashback_periodo UNIQUE (id_promocion_comercial, numero_periodo);

-- Fase 1: Nueva join table zona ManyToMany
CREATE TABLE promocion_comercial_zona (
    id_promocion_comercial BIGINT NOT NULL REFERENCES promocion_comercial(id),
    id_zona                BIGINT NOT NULL REFERENCES zona(id),
    PRIMARY KEY (id_promocion_comercial, id_zona)
);

-- Fase 2: Backfill — migrar id_zona existente al nuevo ManyToMany
INSERT INTO promocion_comercial_zona (id_promocion_comercial, id_zona)
SELECT id, id_zona FROM promocion_comercial WHERE id_zona IS NOT NULL;
