-- Correccion manual: reabrir el periodo 2 de postventa para el documento 74068216.
--
-- Contexto observado en local el 2026-09-04:
-- - El periodo 1 fue cerrado correctamente.
-- - El periodo 2 fue cerrado por error con pago/datos de factura.
-- - Ese cierre creo automaticamente el periodo 3.
--
-- Resultado esperado:
-- - Periodo 1 queda cerrado.
-- - Periodo 2 queda ABIERTO, sin pago confirmado ni datos de factura confirmada.
-- - Periodo 3 se elimina solo si sigue vacio.

\set ON_ERROR_STOP on

BEGIN;

SELECT 'ANTES' AS momento,
       l.id AS lead_id,
       l.etapa,
       l.estado,
       l.estado_cliente_postventa,
       p.id AS periodo_id,
       p.numero_periodo,
       p.estado AS estado_periodo,
       p.fecha_inicio_periodo,
       p.fecha_fin_periodo,
       p.fecha_emision_confirmada,
       p.fecha_vencimiento_confirmado,
       p.monto_facturado,
       COUNT(DISTINCT pg.id) AS pagos,
       COUNT(DISTINCT e.id) AS encuestas
  FROM lead l
  JOIN periodo_facturacion_postventa p ON p.id_lead = l.id
  LEFT JOIN pago_postventa pg ON pg.id_periodo_facturacion = p.id
  LEFT JOIN encuesta_postventa e ON e.id_periodo_facturacion = p.id
 WHERE l.numero_documento_titular_servicio_snapshot = '74068216'
 GROUP BY l.id, p.id
 ORDER BY p.numero_periodo;

DO $$
DECLARE
    v_documento CONSTANT text := '74068216';
    v_lead_id bigint;
    v_calendario_id bigint;
    v_periodo_1_id bigint;
    v_periodo_2_id bigint;
    v_periodo_3_id bigint;
    v_pagos_periodo_2 integer;
    v_pagos_periodo_3 integer;
    v_encuestas_periodo_2 integer;
    v_encuestas_periodo_3 integer;
    v_deleted_pagos integer;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('postventa-periodos-' || v_documento));

    SELECT l.id
      INTO v_lead_id
      FROM lead l
     WHERE l.numero_documento_titular_servicio_snapshot = v_documento;

    IF v_lead_id IS NULL THEN
        RAISE EXCEPTION 'No existe lead para documento %', v_documento;
    END IF;

    IF (
        SELECT COUNT(*)
          FROM lead l
         WHERE l.numero_documento_titular_servicio_snapshot = v_documento
    ) <> 1 THEN
        RAISE EXCEPTION 'El documento % no identifica un unico lead', v_documento;
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM lead l
         WHERE l.id = v_lead_id
           AND l.etapa = 'POSTVENTA'
    ) THEN
        RAISE EXCEPTION 'El lead % no esta en POSTVENTA', v_lead_id;
    END IF;

    SELECT c.id
      INTO v_calendario_id
      FROM calendario_facturacion_postventa c
     WHERE c.id_lead = v_lead_id
       AND c.activo IS TRUE;

    IF v_calendario_id IS NULL THEN
        RAISE EXCEPTION 'El lead % no tiene calendario de postventa activo', v_lead_id;
    END IF;

    SELECT p.id
      INTO v_periodo_1_id
      FROM periodo_facturacion_postventa p
     WHERE p.id_lead = v_lead_id
       AND p.numero_periodo = 1;

    SELECT p.id
      INTO v_periodo_2_id
      FROM periodo_facturacion_postventa p
     WHERE p.id_lead = v_lead_id
       AND p.numero_periodo = 2;

    SELECT p.id
      INTO v_periodo_3_id
      FROM periodo_facturacion_postventa p
     WHERE p.id_lead = v_lead_id
       AND p.numero_periodo = 3;

    IF v_periodo_1_id IS NULL OR v_periodo_2_id IS NULL OR v_periodo_3_id IS NULL THEN
        RAISE EXCEPTION 'Se esperaban periodos 1, 2 y 3 para el lead %', v_lead_id;
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM periodo_facturacion_postventa p
         WHERE p.id = v_periodo_1_id
           AND p.estado IN ('CERRADO_PAGO_CLIENTE', 'CERRADO_PAGO_EMPRESA')
    ) THEN
        RAISE EXCEPTION 'El periodo 1 del lead % no esta cerrado por pago', v_lead_id;
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM periodo_facturacion_postventa p
         WHERE p.id = v_periodo_2_id
           AND p.estado IN ('CERRADO_PAGO_CLIENTE', 'CERRADO_PAGO_EMPRESA')
    ) THEN
        RAISE EXCEPTION 'El periodo 2 del lead % no esta cerrado por pago como se esperaba', v_lead_id;
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM periodo_facturacion_postventa p
         WHERE p.id = v_periodo_3_id
           AND p.estado = 'ABIERTO'
    ) THEN
        RAISE EXCEPTION 'El periodo 3 del lead % no esta ABIERTO como se esperaba', v_lead_id;
    END IF;

    SELECT COUNT(*) INTO v_pagos_periodo_2
      FROM pago_postventa pg
     WHERE pg.id_periodo_facturacion = v_periodo_2_id;

    SELECT COUNT(*) INTO v_pagos_periodo_3
      FROM pago_postventa pg
     WHERE pg.id_periodo_facturacion = v_periodo_3_id;

    SELECT COUNT(*) INTO v_encuestas_periodo_2
      FROM encuesta_postventa e
     WHERE e.id_periodo_facturacion = v_periodo_2_id;

    SELECT COUNT(*) INTO v_encuestas_periodo_3
      FROM encuesta_postventa e
     WHERE e.id_periodo_facturacion = v_periodo_3_id;

    IF v_pagos_periodo_2 <> 1 THEN
        RAISE EXCEPTION 'El periodo 2 debe tener exactamente 1 pago errado; tiene %', v_pagos_periodo_2;
    END IF;

    IF v_encuestas_periodo_2 <> 0 THEN
        RAISE EXCEPTION 'El periodo 2 tiene % encuestas; revisar manualmente antes de reabrir', v_encuestas_periodo_2;
    END IF;

    IF v_pagos_periodo_3 <> 0 OR v_encuestas_periodo_3 <> 0 THEN
        RAISE EXCEPTION 'El periodo 3 no esta vacio: pagos %, encuestas %', v_pagos_periodo_3, v_encuestas_periodo_3;
    END IF;

    DELETE FROM pago_postventa pg
     WHERE pg.id_periodo_facturacion = v_periodo_2_id;

    GET DIAGNOSTICS v_deleted_pagos = ROW_COUNT;

    IF v_deleted_pagos <> 1 THEN
        RAISE EXCEPTION 'Se esperaba eliminar 1 pago del periodo 2, pero se eliminaron %', v_deleted_pagos;
    END IF;

    DELETE FROM periodo_facturacion_postventa p
     WHERE p.id = v_periodo_3_id
       AND p.estado = 'ABIERTO'
       AND NOT EXISTS (
            SELECT 1
              FROM pago_postventa pg
             WHERE pg.id_periodo_facturacion = p.id
       )
       AND NOT EXISTS (
            SELECT 1
              FROM encuesta_postventa e
             WHERE e.id_periodo_facturacion = p.id
       );

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se pudo eliminar el periodo 3 vacio %', v_periodo_3_id;
    END IF;

    UPDATE periodo_facturacion_postventa p
       SET estado = 'ABIERTO',
           fecha_emision_confirmada = NULL,
           fecha_vencimiento_confirmado = NULL,
           monto_facturado = NULL,
           observacion = NULL,
           updated_at = now()
     WHERE p.id = v_periodo_2_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se pudo reabrir el periodo 2 %', v_periodo_2_id;
    END IF;

    UPDATE lead l
       SET estado_cliente_postventa = 'ACTIVO',
           updated_at = now()
     WHERE l.id = v_lead_id
       AND l.etapa = 'POSTVENTA';

    RAISE NOTICE 'Correccion completada. lead %, calendario %, periodo 2 reabierto %, periodo 3 eliminado %, pagos eliminados %',
        v_lead_id, v_calendario_id, v_periodo_2_id, v_periodo_3_id, v_deleted_pagos;
END $$;

SELECT 'DESPUES' AS momento,
       l.id AS lead_id,
       l.etapa,
       l.estado,
       l.estado_cliente_postventa,
       p.id AS periodo_id,
       p.numero_periodo,
       p.estado AS estado_periodo,
       p.fecha_inicio_periodo,
       p.fecha_fin_periodo,
       p.fecha_emision_confirmada,
       p.fecha_vencimiento_confirmado,
       p.monto_facturado,
       COUNT(DISTINCT pg.id) AS pagos,
       COUNT(DISTINCT e.id) AS encuestas
  FROM lead l
  JOIN periodo_facturacion_postventa p ON p.id_lead = l.id
  LEFT JOIN pago_postventa pg ON pg.id_periodo_facturacion = p.id
  LEFT JOIN encuesta_postventa e ON e.id_periodo_facturacion = p.id
 WHERE l.numero_documento_titular_servicio_snapshot = '74068216'
 GROUP BY l.id, p.id
 ORDER BY p.numero_periodo;

COMMIT;
