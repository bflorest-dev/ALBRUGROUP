ALTER TABLE equipo_proveedor
    ADD COLUMN IF NOT EXISTS fallback_lead_sin_campana BOOLEAN NOT NULL DEFAULT FALSE;

WITH candidatos AS (
    SELECT
        ep.id,
        ROW_NUMBER() OVER (
            PARTITION BY ep.id_equipo
            ORDER BY
                CASE
                    WHEN UPPER(p.nombre) IN ('WIN', 'CLARO') THEN 0
                    ELSE 1
                END,
                p.id
        ) AS orden
    FROM equipo_proveedor ep
    JOIN proveedor p ON p.id = ep.id_proveedor
)
UPDATE equipo_proveedor ep
SET fallback_lead_sin_campana = TRUE
FROM candidatos c
WHERE c.id = ep.id
  AND c.orden = 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_equipo_proveedor_fallback_lead_sin_campana
    ON equipo_proveedor (id_equipo)
    WHERE fallback_lead_sin_campana = TRUE;
