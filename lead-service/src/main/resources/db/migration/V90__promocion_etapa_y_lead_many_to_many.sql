-- Campo etapa en promocion_comercial
ALTER TABLE promocion_comercial ADD COLUMN etapa VARCHAR(20);

-- Backfill: la promo existente es de PREVENTA
UPDATE promocion_comercial SET etapa = 'PREVENTA' WHERE etapa IS NULL;

-- Join table lead <-> promocion_comercial (reemplaza lead.id_promocion_interna)
CREATE TABLE lead_promocion_comercial (
    id_lead                 BIGINT NOT NULL REFERENCES lead(id),
    id_promocion_comercial  BIGINT NOT NULL REFERENCES promocion_comercial(id),
    PRIMARY KEY (id_lead, id_promocion_comercial)
);

-- Backfill: migrar id_promocion_interna a la join table
INSERT INTO lead_promocion_comercial (id_lead, id_promocion_comercial)
SELECT id, id_promocion_interna FROM lead WHERE id_promocion_interna IS NOT NULL;
