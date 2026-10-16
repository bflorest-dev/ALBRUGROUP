ALTER TABLE resumen_financiero_dia
    ADD COLUMN cashback_preventa NUMERIC(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN cashback_postventa NUMERIC(12,2) NOT NULL DEFAULT 0;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM promocion_comercial
        WHERE etapa IS NULL
           OR etapa NOT IN ('PREVENTA', 'VENTA', 'POSTVENTA', 'COBRANZA')
    ) THEN
        RAISE EXCEPTION 'Existen promociones comerciales con una etapa nula o inválida';
    END IF;
END $$;

UPDATE resumen_financiero_dia r
SET cashback_preventa = COALESCE((
        SELECT SUM(cp.monto)
        FROM lead l
        JOIN lead_promocion_comercial lpc ON lpc.id_lead = l.id
        JOIN promocion_comercial p ON p.id = lpc.id_promocion_comercial
        JOIN promocion_cashback_periodo cp ON cp.id_promocion_comercial = p.id
        WHERE l.id_proveedor = r.id_proveedor
          AND p.etapa = 'PREVENTA'
          AND EXISTS (
              SELECT 1
              FROM lead_seguimiento ls
              WHERE ls.id_lead = l.id
                AND ls.fecha_instalacion = r.fecha
          )
    ), 0),
    cashback_postventa = COALESCE((
        SELECT SUM(cp.monto)
        FROM lead l
        JOIN lead_promocion_comercial lpc ON lpc.id_lead = l.id
        JOIN promocion_comercial p ON p.id = lpc.id_promocion_comercial
        JOIN promocion_cashback_periodo cp ON cp.id_promocion_comercial = p.id
        WHERE l.id_proveedor = r.id_proveedor
          AND p.etapa = 'POSTVENTA'
          AND EXISTS (
              SELECT 1
              FROM lead_seguimiento ls
              WHERE ls.id_lead = l.id
                AND ls.fecha_instalacion = r.fecha
          )
    ), 0);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM resumen_financiero_dia
        WHERE cashback_preventa IS NULL
           OR cashback_postventa IS NULL
    ) THEN
        RAISE EXCEPTION 'El backfill de cashback dejó valores nulos';
    END IF;
END $$;
