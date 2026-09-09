ALTER TABLE tipificacion
    ADD COLUMN IF NOT EXISTS seleccionable_manual boolean NOT NULL DEFAULT true;

ALTER TABLE subtipificacion
    ADD COLUMN IF NOT EXISTS tipificacion_conversion_id bigint,
    ADD COLUMN IF NOT EXISTS subtipificacion_conversion_id bigint;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_subtipificacion_tipificacion_conversion'
    ) THEN
        ALTER TABLE subtipificacion
            ADD CONSTRAINT fk_subtipificacion_tipificacion_conversion
            FOREIGN KEY (tipificacion_conversion_id) REFERENCES tipificacion(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_subtipificacion_subtipificacion_conversion'
    ) THEN
        ALTER TABLE subtipificacion
            ADD CONSTRAINT fk_subtipificacion_subtipificacion_conversion
            FOREIGN KEY (subtipificacion_conversion_id) REFERENCES subtipificacion(id);
    END IF;
END $$;

ALTER TABLE evento
    ADD COLUMN IF NOT EXISTS id_tipificacion_resultado bigint,
    ADD COLUMN IF NOT EXISTS id_subtipificacion_resultado bigint,
    ADD COLUMN IF NOT EXISTS tipificacion_resultado varchar(255),
    ADD COLUMN IF NOT EXISTS subtipificacion_resultado varchar(255);

UPDATE evento
SET tipificacion_resultado = tipificacion,
    subtipificacion_resultado = subtipificacion
WHERE accion = 'TIPIFICACION'
  AND tipificacion_resultado IS NULL
  AND subtipificacion_resultado IS NULL;

WITH retornos AS (
    SELECT s.id AS subtipificacion_origen_id,
           td.id AS tipificacion_destino_id,
           sd.id AS subtipificacion_destino_id
    FROM subtipificacion s
    JOIN tipificacion t ON t.id = s.tipificacion_id
    JOIN matriz_tipificacion mo ON mo.id = t.matriz_id
    JOIN matriz_tipificacion md
      ON md.id_proveedor = mo.id_proveedor
     AND md.etapa = 'PREVENTA'
    JOIN tipificacion td
      ON td.matriz_id = md.id
     AND td.codigo = 'NO DESEA'
     AND td.activo = true
    JOIN subtipificacion sd
      ON sd.tipificacion_id = td.id
     AND sd.codigo = 'PREVENTA DESAPROBADA'
     AND sd.activo = true
    WHERE mo.etapa = 'VENTA'
      AND s.etapa_cambio = 'PREVENTA'
      AND s.activo = true
)
UPDATE subtipificacion s
SET tipificacion_conversion_id = retornos.tipificacion_destino_id,
    subtipificacion_conversion_id = retornos.subtipificacion_destino_id
FROM retornos
WHERE s.id = retornos.subtipificacion_origen_id
  AND s.tipificacion_conversion_id IS NULL
  AND s.subtipificacion_conversion_id IS NULL;
