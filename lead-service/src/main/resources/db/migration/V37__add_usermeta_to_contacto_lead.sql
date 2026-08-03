ALTER TABLE contacto
    ADD COLUMN IF NOT EXISTS usermeta VARCHAR(255);

ALTER TABLE lead
    ADD COLUMN IF NOT EXISTS usermeta VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS uq_contacto_usermeta_lower
    ON contacto (lower(usermeta))
    WHERE usermeta IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lead_usermeta_lower
    ON lead (lower(usermeta))
    WHERE usermeta IS NOT NULL;

ALTER TABLE contacto
    ADD CONSTRAINT chk_contacto_identificador_minimo
    CHECK (
        usermeta IS NOT NULL
        OR (prefijo IS NOT NULL AND lead IS NOT NULL)
    ) NOT VALID;

ALTER TABLE lead
    ADD CONSTRAINT chk_lead_identificador_minimo
    CHECK (
        usermeta IS NOT NULL
        OR (prefijo IS NOT NULL AND lead IS NOT NULL)
    ) NOT VALID;
