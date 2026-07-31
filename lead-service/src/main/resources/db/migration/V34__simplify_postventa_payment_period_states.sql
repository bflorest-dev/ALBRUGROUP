ALTER TABLE pago_postventa
    ADD COLUMN IF NOT EXISTS condicion VARCHAR(255);

UPDATE pago_postventa
SET condicion = 'NORMAL'
WHERE condicion IS NULL;

UPDATE pago_postventa
SET estado = CASE
    WHEN fecha_pago IS NOT NULL AND aportante = 'EMPRESA' THEN 'PAGADO_EMPRESA'
    WHEN fecha_pago IS NOT NULL THEN 'PAGADO_CLIENTE'
    WHEN fecha_compromiso_pago IS NOT NULL THEN 'COMPROMETIDO'
    WHEN estado = 'CUBIERTO_EMPRESA' THEN 'PAGADO_EMPRESA'
    WHEN estado = 'PAGADO' THEN 'PAGADO_CLIENTE'
    ELSE 'COMPROMETIDO'
END
WHERE estado IS NULL
   OR estado IN ('PENDIENTE', 'PAGADO', 'VENCIDO', 'CUBIERTO_EMPRESA', 'ANULADO', 'COMPROMETIDO');

UPDATE periodo_facturacion_postventa p
SET estado = CASE
    WHEN p.estado = 'PAGO_CONFIRMADO'
        AND EXISTS (
            SELECT 1
            FROM pago_postventa pg
            WHERE pg.id_periodo_facturacion = p.id
              AND (pg.estado = 'PAGADO_EMPRESA'
                   OR (pg.fecha_pago IS NOT NULL AND pg.aportante = 'EMPRESA'))
        )
        THEN 'CERRADO_PAGO_EMPRESA'
    WHEN p.estado = 'PAGO_CONFIRMADO' THEN 'CERRADO_PAGO_CLIENTE'
    WHEN p.estado = 'BAJA' THEN 'CERRADO_BAJA'
    WHEN p.estado = 'ANULADO' THEN 'CERRADO_BAJA'
    ELSE 'ABIERTO'
END
WHERE p.estado IS NULL
   OR p.estado IN (
        'PROGRAMADO',
        'FACTURA_EMITIDA',
        'PAGO_PENDIENTE',
        'PAGO_CONFIRMADO',
        'VENCIDO',
        'EN_COBRANZA',
        'BAJA',
        'ANULADO'
   );

CREATE INDEX IF NOT EXISTS idx_pago_postventa_periodo_estado_fecha
    ON pago_postventa (id_periodo_facturacion, estado, fecha_pago DESC, created_at DESC);
