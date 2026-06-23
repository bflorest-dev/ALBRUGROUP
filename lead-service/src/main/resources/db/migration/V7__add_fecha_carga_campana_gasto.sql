ALTER TABLE campana_gasto_registro
    ADD COLUMN fecha_carga DATE;

UPDATE campana_gasto_registro
SET fecha_carga = COALESCE(
    (created_at AT TIME ZONE 'America/Lima')::date,
    (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date
);

ALTER TABLE campana_gasto_registro
    ALTER COLUMN fecha_carga SET NOT NULL;

CREATE INDEX idx_campana_gasto_campana_fecha_carga
    ON campana_gasto_registro (id_campana, fecha_carga);
