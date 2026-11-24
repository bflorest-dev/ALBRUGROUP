ALTER TABLE lead ADD COLUMN IF NOT EXISTS estado_expediente VARCHAR(255);

-- Backfill: leads CLARO ya en POSTVENTA/COBRANZA → EXPEDIENTE_PENDIENTE
-- Obliga revisión manual antes de que cuenten para comisiones.
UPDATE lead l
SET estado_expediente = 'EXPEDIENTE_PENDIENTE'
FROM plan p
JOIN proveedor prov ON prov.id = p.id_proveedor
WHERE l.id_plan = p.id
  AND UPPER(TRIM(prov.nombre)) = 'CLARO'
  AND l.etapa IN ('POSTVENTA', 'COBRANZA')
  AND l.estado_expediente IS NULL;
