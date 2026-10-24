-- V95: Flag fue_moroso_primer_periodo en lead_seguimiento.
-- true = la empresa pagó en el periodo 1 (moroso). Inmutable: nunca vuelve a false.
ALTER TABLE lead_seguimiento ADD COLUMN fue_moroso_primer_periodo BOOLEAN;

-- Backfill: marcar los leads que ya tienen PAGADO_EMPRESA en periodo 1.
UPDATE lead_seguimiento ls
SET fue_moroso_primer_periodo = true
WHERE EXISTS (
    SELECT 1
    FROM pago_postventa pp
    JOIN periodo_facturacion_postventa pf ON pf.id = pp.id_periodo_facturacion
    WHERE pp.id_lead = ls.id_lead
      AND pf.numero_periodo = 1
      AND pp.estado = 'PAGADO_EMPRESA'
);
