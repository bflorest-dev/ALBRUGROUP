-- Backfill: asignar id_zona a leads que tienen proveedor y ubigeo válido.
-- Replica la lógica de ZonaService.coincideConReglas():
--   1. Si el distrito coincide con alguna regla EXCLUIR → descartada
--   2. Si la zona no tiene reglas INCLUIR → todo lo no excluido entra
--   3. Si tiene reglas INCLUIR → el distrito debe coincidir con al menos una

UPDATE lead
SET id_zona = matched.zona_id
FROM (
    SELECT DISTINCT ON (lu.lead_id) lu.lead_id, z.id AS zona_id
    FROM (
        SELECT l.id AS lead_id, l.id_proveedor,
               di.id AS distrito_id, di.provincia_id, di.departamento_id
        FROM lead l
        JOIN direccion d ON d.id = l.id_direccion
        JOIN distrito di ON di.codigo = d.ubigeo_domicilio
        WHERE l.id_proveedor IS NOT NULL
          AND l.id_zona IS NULL
          AND d.ubigeo_domicilio IS NOT NULL
          AND d.ubigeo_domicilio != ''
    ) lu
    JOIN zona z ON z.id_proveedor = lu.id_proveedor
               AND z.es_geografica = true
               AND z.activo = true
    WHERE NOT EXISTS (
        SELECT 1 FROM zona_regla zr
        WHERE zr.zona_id = z.id
          AND zr.criterio = 'EXCLUIR'
          AND (
            (zr.nivel_geografico = 'DISTRITO'     AND zr.geo_id = lu.distrito_id)
         OR (zr.nivel_geografico = 'PROVINCIA'    AND zr.geo_id = lu.provincia_id)
         OR (zr.nivel_geografico = 'DEPARTAMENTO' AND zr.geo_id = lu.departamento_id)
          )
    )
    AND (
        NOT EXISTS (
            SELECT 1 FROM zona_regla zr2
            WHERE zr2.zona_id = z.id AND zr2.criterio = 'INCLUIR'
        )
        OR EXISTS (
            SELECT 1 FROM zona_regla zr3
            WHERE zr3.zona_id = z.id
              AND zr3.criterio = 'INCLUIR'
              AND (
                (zr3.nivel_geografico = 'DISTRITO'     AND zr3.geo_id = lu.distrito_id)
             OR (zr3.nivel_geografico = 'PROVINCIA'    AND zr3.geo_id = lu.provincia_id)
             OR (zr3.nivel_geografico = 'DEPARTAMENTO' AND zr3.geo_id = lu.departamento_id)
              )
        )
    )
    ORDER BY lu.lead_id, z.id
) matched
WHERE lead.id = matched.lead_id;

-- Validación: solo falla si un lead cuyo proveedor TIENE zonas geográficas no matcheó ninguna.
-- Proveedores sin zonas geográficas son legítimos (aún no las configuraron).
DO $$
DECLARE
    huerfanos INTEGER;
BEGIN
    SELECT count(*) INTO huerfanos
    FROM lead l
    JOIN direccion d ON d.id = l.id_direccion
    JOIN distrito di ON di.codigo = d.ubigeo_domicilio
    WHERE l.id_proveedor IS NOT NULL
      AND l.id_zona IS NULL
      AND d.ubigeo_domicilio IS NOT NULL
      AND d.ubigeo_domicilio != ''
      AND EXISTS (
          SELECT 1 FROM zona z
          WHERE z.id_proveedor = l.id_proveedor
            AND z.es_geografica = true
            AND z.activo = true
      );

    IF huerfanos > 0 THEN
        RAISE EXCEPTION 'Backfill incompleto: % leads con proveedor (que tiene zonas geográficas) y ubigeo válido quedaron sin zona', huerfanos;
    END IF;
END $$;
