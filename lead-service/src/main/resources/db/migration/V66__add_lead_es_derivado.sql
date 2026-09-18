ALTER TABLE lead
    ADD COLUMN IF NOT EXISTS es_derivado BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS uk_lead_asesor_derivado
    ON lead (id_asesor_asignado)
    WHERE es_derivado = true AND id_asesor_asignado IS NOT NULL;
