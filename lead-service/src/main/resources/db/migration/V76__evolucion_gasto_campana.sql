-- Evoluciona el registro operativo de gastos sin alterar las fechas automáticas del sistema.
ALTER TABLE campana_gasto_registro RENAME TO gasto_campana;

ALTER TABLE gasto_campana RENAME COLUMN leads TO leads_reportados;
ALTER TABLE gasto_campana RENAME COLUMN ventas_cerradas TO cantidad_preventas;
ALTER TABLE gasto_campana ADD COLUMN cantidad_ventas INTEGER;
ALTER TABLE gasto_campana ADD COLUMN reported_at TIMESTAMP WITHOUT TIME ZONE;

-- created_at es un instante del sistema. Se convierte únicamente para obtener la hora operativa local histórica.
UPDATE gasto_campana
SET reported_at = (created_at AT TIME ZONE 'America/Lima')::timestamp
WHERE reported_at IS NULL;

ALTER TABLE gasto_campana ALTER COLUMN reported_at SET NOT NULL;
ALTER TABLE gasto_campana DROP COLUMN fecha_carga;

DROP INDEX IF EXISTS idx_campana_gasto_campana_created;
DROP INDEX IF EXISTS idx_campana_gasto_created;
DROP INDEX IF EXISTS idx_campana_gasto_campana_fecha_carga;

CREATE INDEX idx_gasto_campana_reported
    ON gasto_campana (id_campana, reported_at, id);
CREATE INDEX idx_gasto_campana_reported_at
    ON gasto_campana (reported_at);
