-- Agrega id_proveedor_origen e id_proveedor al Lead para reemplazar la resolución
-- indirecta vía plan.id_proveedor que falla cuando id_plan es NULL.

-- 1. Columnas
ALTER TABLE lead ADD COLUMN id_proveedor_origen BIGINT REFERENCES proveedor(id);
ALTER TABLE lead ADD COLUMN id_proveedor BIGINT REFERENCES proveedor(id);

CREATE INDEX idx_lead_id_proveedor ON lead(id_proveedor);
CREATE INDEX idx_lead_id_proveedor_origen ON lead(id_proveedor_origen);

-- 2. Poblar id_proveedor_origen (ningún lead debe quedar sin este dato)

--    Prioridad 1: desde equipo_proveedor (fallback del equipo)
UPDATE lead l
SET id_proveedor_origen = ep.id_proveedor
FROM equipo_proveedor ep
WHERE ep.id_equipo = l.id_equipo
  AND ep.fallback_lead_sin_campana = true
  AND l.id_proveedor_origen IS NULL;

--    Prioridad 2: desde campaña
UPDATE lead l
SET id_proveedor_origen = c.id_proveedor
FROM campana c
WHERE c.id = l.id_campana
  AND c.id_proveedor IS NOT NULL
  AND l.id_proveedor_origen IS NULL;

--    Prioridad 3: fallback WIN para los que queden sin resolver
UPDATE lead l
SET id_proveedor_origen = (SELECT id FROM proveedor WHERE UPPER(nombre) = 'WIN' LIMIT 1)
WHERE l.id_proveedor_origen IS NULL;

-- 3. Poblar id_proveedor solo para leads que NO están en PREVENTA

--    Prioridad 1: desde plan.id_proveedor (fuente más confiable)
UPDATE lead l
SET id_proveedor = p.id_proveedor
FROM plan p
WHERE p.id = l.id_plan
  AND l.etapa != 'PREVENTA'
  AND l.id_proveedor IS NULL;

--    Prioridad 2: desde nombre_proveedor_snapshot → proveedor.nombre
UPDATE lead l
SET id_proveedor = prov.id
FROM proveedor prov
WHERE UPPER(TRIM(l.nombre_proveedor_snapshot)) = UPPER(TRIM(prov.nombre))
  AND l.etapa != 'PREVENTA'
  AND l.id_proveedor IS NULL
  AND l.nombre_proveedor_snapshot IS NOT NULL;

--    Prioridad 3: copiar id_proveedor_origen como último recurso
UPDATE lead l
SET id_proveedor = l.id_proveedor_origen
WHERE l.etapa != 'PREVENTA'
  AND l.id_proveedor IS NULL
  AND l.id_proveedor_origen IS NOT NULL;
