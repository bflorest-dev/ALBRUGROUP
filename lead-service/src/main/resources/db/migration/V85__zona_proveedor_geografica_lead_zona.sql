-- Zona: agregar relación con proveedor y flag geográfica
ALTER TABLE zona ADD COLUMN id_proveedor BIGINT REFERENCES proveedor(id);
ALTER TABLE zona ADD COLUMN es_geografica BOOLEAN NOT NULL DEFAULT false;

-- Backfill: la única zona existente (LIMA_WIN) es de WIN y es geográfica
UPDATE zona SET id_proveedor = 1, es_geografica = true WHERE id = 1;

-- Validar que no queden zonas sin proveedor
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM zona WHERE id_proveedor IS NULL) THEN
    RAISE EXCEPTION 'Hay zonas sin proveedor asignado — revisar manualmente';
  END IF;
END $$;

ALTER TABLE zona ALTER COLUMN id_proveedor SET NOT NULL;

-- Lead: agregar FK a zona (nullable — se resuelve al setear plan/proveedor)
ALTER TABLE lead ADD COLUMN id_zona BIGINT REFERENCES zona(id);
