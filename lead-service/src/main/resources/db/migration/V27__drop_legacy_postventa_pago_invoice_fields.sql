DROP INDEX IF EXISTS idx_pago_postventa_vencimiento;

ALTER TABLE pago_postventa
    DROP COLUMN IF EXISTS fecha_emision,
    DROP COLUMN IF EXISTS fecha_vencimiento;
