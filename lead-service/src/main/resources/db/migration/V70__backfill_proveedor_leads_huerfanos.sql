-- Backfill para leads creados entre el deploy de V68 (columnas) y este deploy (write-side).
-- Repite la misma lógica de V68 para cubrir leads que quedaron sin poblar.

-- id_proveedor_origen: prioridad equipo > campaña > WIN fallback
UPDATE lead l
SET id_proveedor_origen = ep.id_proveedor
FROM equipo_proveedor ep
WHERE ep.id_equipo = l.id_equipo
  AND ep.fallback_lead_sin_campana = true
  AND l.id_proveedor_origen IS NULL;

UPDATE lead l
SET id_proveedor_origen = c.id_proveedor
FROM campana c
WHERE c.id = l.id_campana
  AND c.id_proveedor IS NOT NULL
  AND l.id_proveedor_origen IS NULL;

UPDATE lead l
SET id_proveedor_origen = (SELECT id FROM proveedor WHERE UPPER(nombre) = 'WIN' LIMIT 1)
WHERE l.id_proveedor_origen IS NULL;

-- id_proveedor: solo leads fuera de PREVENTA sin proveedor final
UPDATE lead l
SET id_proveedor = p.id_proveedor
FROM plan p
WHERE p.id = l.id_plan
  AND l.etapa != 'PREVENTA'
  AND l.id_proveedor IS NULL;

UPDATE lead l
SET id_proveedor = prov.id
FROM proveedor prov
WHERE UPPER(TRIM(l.nombre_proveedor_snapshot)) = UPPER(TRIM(prov.nombre))
  AND l.etapa != 'PREVENTA'
  AND l.id_proveedor IS NULL
  AND l.nombre_proveedor_snapshot IS NOT NULL;

UPDATE lead l
SET id_proveedor = l.id_proveedor_origen
WHERE l.etapa != 'PREVENTA'
  AND l.id_proveedor IS NULL
  AND l.id_proveedor_origen IS NOT NULL;
