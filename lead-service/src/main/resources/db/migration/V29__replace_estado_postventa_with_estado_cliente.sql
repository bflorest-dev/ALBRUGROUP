ALTER TABLE lead
    ADD COLUMN IF NOT EXISTS estado_cliente_postventa VARCHAR(255);

UPDATE lead
SET estado_cliente_postventa = CASE
    WHEN estado_postventa IN ('BAJA_CONFIRMADA', 'NO_EFECTIVO') THEN 'BAJA'
    WHEN estado_postventa IN ('EN_COBRANZA', 'PAGO_CUBIERTO_EMPRESA') THEN 'SUSPENDIDO'
    WHEN etapa = 'POSTVENTA' THEN 'ACTIVO'
    ELSE estado_cliente_postventa
END
WHERE estado_cliente_postventa IS NULL;

ALTER TABLE subtipificacion
    DROP COLUMN IF EXISTS estado_postventa_cambio;

ALTER TABLE lead
    DROP COLUMN IF EXISTS estado_postventa;
