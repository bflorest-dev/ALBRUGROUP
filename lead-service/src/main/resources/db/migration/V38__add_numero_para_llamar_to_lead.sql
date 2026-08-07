ALTER TABLE lead
    ADD COLUMN IF NOT EXISTS numero_para_llamar VARCHAR(15);

UPDATE lead
SET numero_para_llamar = lead
WHERE numero_para_llamar IS NULL
  AND lead IS NOT NULL
  AND trim(lead) ~ '^9[0-9]{8}$';

ALTER TABLE lead
    ADD CONSTRAINT chk_lead_numero_para_llamar_formato
    CHECK (
        numero_para_llamar IS NULL
        OR numero_para_llamar ~ '^9[0-9]{8}$'
    ) NOT VALID;
