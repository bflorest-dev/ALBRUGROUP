-- V96: Retiro de fue_moroso_primer_periodo.
-- La morosidad se calcula siempre en tiempo de consulta (fecha_pago > fecha_vencimiento P1).
ALTER TABLE lead_seguimiento DROP COLUMN fue_moroso_primer_periodo;
