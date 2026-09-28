-- V82: Puebla lead_seguimiento.fecha_suspension / fecha_baja (antes columnas muertas).
-- Son fechas automaticas de POSTVENTA. Se cambian a TIMESTAMPTZ (instant) para casar con fecha_cierre y
-- con la naturaleza del hito. Las columnas estaban vacias, asi que el cambio de tipo no migra datos.
-- Fuente: PeriodoFacturacionPostventa.fecha_cierre (ver V79/reworks/5) y, para suspension por pago,
-- PagoPostventa.created_at. Un lead puede llegar a BAJA sin SUSPENDIDO previo (CERRADO_BAJA directo).

-- 1) Cambio de tipo DATE -> TIMESTAMPTZ (columnas vacias).
ALTER TABLE lead_seguimiento ALTER COLUMN fecha_suspension TYPE TIMESTAMPTZ USING fecha_suspension::timestamptz;
ALTER TABLE lead_seguimiento ALTER COLUMN fecha_baja        TYPE TIMESTAMPTZ USING fecha_baja::timestamptz;

-- 2) Tabla de auditoria de fechas aproximadas (registro durable de los anomalos, para corregir luego).
CREATE TABLE IF NOT EXISTS lead_seguimiento_backfill_aprox (
    id           BIGSERIAL    PRIMARY KEY,
    id_lead      BIGINT       NOT NULL,
    campo        VARCHAR(30)  NOT NULL,
    valor        TIMESTAMPTZ  NOT NULL,
    motivo       VARCHAR(200) NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 3) Asegurar fila de seguimiento para todo lead actualmente SUSPENDIDO o BAJA.
INSERT INTO lead_seguimiento (id_lead)
SELECT l.id
FROM lead l
WHERE l.estado_cliente_postventa IN ('SUSPENDIDO', 'BAJA')
  AND NOT EXISTS (SELECT 1 FROM lead_seguimiento s WHERE s.id_lead = l.id);

-- 3) fecha_baja: fecha_cierre del ultimo periodo cerrado como BAJA (solo leads actualmente en BAJA).
UPDATE lead_seguimiento seg
SET fecha_baja = sub.fc
FROM (
    SELECT p.id_lead, MAX(p.fecha_cierre) AS fc
    FROM periodo_facturacion_postventa p
    WHERE p.estado IN ('CERRADO_BAJA', 'CERRADO_BAJA_ADEUDO')
      AND p.fecha_cierre IS NOT NULL
    GROUP BY p.id_lead
) sub
JOIN lead l ON l.id = sub.id_lead AND l.estado_cliente_postventa = 'BAJA'
WHERE seg.id_lead = sub.id_lead;

-- 4) fecha_suspension: ultimo momento de suspension (cierre CERRADO_PAGO_EMPRESA o pago empresa/comprometido).
--    Aplica a SUSPENDIDO y tambien a BAJA (si tuvo una suspension previa; si no, queda NULL).
UPDATE lead_seguimiento seg
SET fecha_suspension = sub.fs
FROM (
    SELECT id_lead, MAX(momento) AS fs
    FROM (
        SELECT p.id_lead, p.fecha_cierre AS momento
        FROM periodo_facturacion_postventa p
        WHERE p.estado = 'CERRADO_PAGO_EMPRESA'
          AND p.fecha_cierre IS NOT NULL
        UNION ALL
        SELECT pg.id_lead, pg.created_at AS momento
        FROM pago_postventa pg
        WHERE pg.estado IN ('PAGADO_EMPRESA', 'COMPROMETIDO')
          AND pg.created_at IS NOT NULL
    ) t
    GROUP BY id_lead
) sub
JOIN lead l ON l.id = sub.id_lead AND l.estado_cliente_postventa IN ('SUSPENDIDO', 'BAJA')
WHERE seg.id_lead = sub.id_lead;

-- 6) ANOMALOS — estado heredado inconsistente (sin cierre/pago que lo justifique). Se sella una fecha
--    APROXIMADA = MAX(periodo.updated_at) del lead, o lead.updated_at si no tiene periodos, y se DEJA
--    REGISTRADO en lead_seguimiento_backfill_aprox para corregirlo luego si se necesita mas precision.
--    6a) BAJA sin fecha_baja.
INSERT INTO lead_seguimiento_backfill_aprox (id_lead, campo, valor, motivo)
SELECT l.id, 'fecha_baja',
       COALESCE((SELECT MAX(p.updated_at) FROM periodo_facturacion_postventa p WHERE p.id_lead = l.id), l.updated_at),
       'BAJA sin periodo CERRADO_BAJA; fecha aproximada'
FROM lead l
JOIN lead_seguimiento seg ON seg.id_lead = l.id
WHERE l.estado_cliente_postventa = 'BAJA' AND seg.fecha_baja IS NULL;

UPDATE lead_seguimiento seg
SET fecha_baja = COALESCE(
        (SELECT MAX(p.updated_at) FROM periodo_facturacion_postventa p WHERE p.id_lead = seg.id_lead),
        l.updated_at)
FROM lead l
WHERE seg.id_lead = l.id AND l.estado_cliente_postventa = 'BAJA' AND seg.fecha_baja IS NULL;

--    6b) SUSPENDIDO sin fecha_suspension.
INSERT INTO lead_seguimiento_backfill_aprox (id_lead, campo, valor, motivo)
SELECT l.id, 'fecha_suspension',
       COALESCE((SELECT MAX(p.updated_at) FROM periodo_facturacion_postventa p WHERE p.id_lead = l.id), l.updated_at),
       'SUSPENDIDO sin cierre/pago que lo justifique; fecha aproximada'
FROM lead l
JOIN lead_seguimiento seg ON seg.id_lead = l.id
WHERE l.estado_cliente_postventa = 'SUSPENDIDO' AND seg.fecha_suspension IS NULL;

UPDATE lead_seguimiento seg
SET fecha_suspension = COALESCE(
        (SELECT MAX(p.updated_at) FROM periodo_facturacion_postventa p WHERE p.id_lead = seg.id_lead),
        l.updated_at)
FROM lead l
WHERE seg.id_lead = l.id AND l.estado_cliente_postventa = 'SUSPENDIDO' AND seg.fecha_suspension IS NULL;

-- 7) Red de seguridad: tras el fallback no debe quedar ningun SUSPENDIDO/BAJA sin fecha (p. ej. sin
--    updated_at). Si queda alguno es irrecuperable -> fallar ruidosamente.
DO $$
DECLARE
    huerfanos INTEGER;
BEGIN
    SELECT COUNT(*) INTO huerfanos
    FROM lead l
    JOIN lead_seguimiento seg ON seg.id_lead = l.id
    WHERE (l.estado_cliente_postventa = 'SUSPENDIDO' AND seg.fecha_suspension IS NULL)
       OR (l.estado_cliente_postventa = 'BAJA'       AND seg.fecha_baja       IS NULL);

    IF huerfanos > 0 THEN
        RAISE EXCEPTION 'COBERTURA INCOMPLETA: % leads SUSPENDIDO/BAJA sin fecha ni fallback', huerfanos;
    END IF;
END $$;
