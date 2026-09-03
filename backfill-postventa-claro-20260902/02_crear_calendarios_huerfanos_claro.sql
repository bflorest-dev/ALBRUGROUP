BEGIN;

CREATE TEMP TABLE tmp_claro_huerfanos_metricas (
    metric text PRIMARY KEY,
    value integer NOT NULL
) ON COMMIT DROP;

CREATE TEMP TABLE tmp_claro_huerfanos_scope AS
SELECT
    l.id AS id_lead,
    l.nombre_plan_snapshot,
    l.precio_final,
    COALESCE(l.meses_permanencia_snapshot, pr.meses_permanencia) AS meses_permanencia,
    pr.nombre AS proveedor,
    ev.fecha_instalacion,
    date_trunc('month', ev.fecha_instalacion)::date AS mes_corte_base,
    CASE WHEN EXTRACT(DAY FROM ev.fecha_instalacion) >= 12 THEN 2 ELSE 1 END AS numero_corte_base,
    CASE WHEN EXTRACT(DAY FROM ev.fecha_instalacion) >= 12 THEN 12 ELSE 1 END AS dia_corte,
    ev.fecha_instalacion AS fecha_emision_base,
    (ev.fecha_instalacion + interval '15 days')::date AS fecha_vencimiento_base
FROM lead l
JOIN plan pl ON pl.id = l.id_plan
JOIN proveedor pr ON pr.id = pl.id_proveedor
LEFT JOIN calendario_facturacion_postventa c ON c.id_lead = l.id AND c.activo = true
LEFT JOIN LATERAL (
    SELECT e.fecha_instalacion
    FROM evento e
    WHERE e.id_lead = l.id
      AND e.accion = 'TIPIFICACION'
      AND e.etapa = 'VENTA'
      AND e.tipificacion = 'INSTALADO'
      AND e.fecha_instalacion IS NOT NULL
    ORDER BY e.created_at DESC NULLS LAST, e.id DESC
    LIMIT 1
) ev ON true
WHERE l.etapa = 'POSTVENTA'
  AND UPPER(TRIM(pr.nombre)) = 'CLARO'
  AND c.id IS NULL;

INSERT INTO tmp_claro_huerfanos_metricas(metric, value)
SELECT 'huerfanos_detectados', count(*) FROM tmp_claro_huerfanos_scope;

DO $$
DECLARE
    v_sin_fecha integer;
BEGIN
    SELECT count(*)
    INTO v_sin_fecha
    FROM tmp_claro_huerfanos_scope
    WHERE fecha_instalacion IS NULL;

    IF v_sin_fecha > 0 THEN
        RAISE EXCEPTION 'Hay % leads CLARO POSTVENTA sin calendario y sin evento INSTALADO con fecha_instalacion', v_sin_fecha;
    END IF;
END $$;

WITH lead_actualizado AS (
    UPDATE lead l
    SET
        meses_permanencia_snapshot = COALESCE(l.meses_permanencia_snapshot, s.meses_permanencia),
        estado_cliente_postventa = COALESCE(l.estado_cliente_postventa, 'ACTIVO'),
        updated_at = now()
    FROM tmp_claro_huerfanos_scope s
    WHERE l.id = s.id_lead
      AND (
          l.meses_permanencia_snapshot IS NULL
          OR l.estado_cliente_postventa IS NULL
      )
    RETURNING l.id
)
INSERT INTO tmp_claro_huerfanos_metricas(metric, value)
SELECT 'leads_completados', count(*) FROM lead_actualizado;

WITH calendarios_insertados AS (
    INSERT INTO calendario_facturacion_postventa (
        id_lead,
        fecha_instalacion,
        proveedor_snapshot,
        plan_snapshot,
        meses_permanencia_snapshot,
        monto_plan_snapshot,
        tipo_regla_proveedor,
        dia_corte,
        dia_emision_estimado,
        dia_vencimiento,
        mes_corte_base,
        numero_corte_base,
        bloque_facturacion,
        requiere_prorrateo_inicial,
        activo,
        corte_corregido,
        observacion,
        created_at,
        updated_at
    )
    SELECT
        s.id_lead,
        s.fecha_instalacion,
        'CLARO',
        s.nombre_plan_snapshot,
        s.meses_permanencia,
        s.precio_final,
        'CLARO',
        s.dia_corte,
        EXTRACT(DAY FROM s.fecha_emision_base)::integer,
        EXTRACT(DAY FROM s.fecha_vencimiento_base)::integer,
        s.mes_corte_base,
        s.numero_corte_base,
        CASE WHEN s.numero_corte_base = 2 THEN 'MES_SIGUIENTE' ELSE 'MISMO_MES' END,
        true,
        true,
        false,
        'BACKFILL_CLARO_20260902 | calendario creado para lead huerfano POSTVENTA',
        now(),
        now()
    FROM tmp_claro_huerfanos_scope s
    WHERE NOT EXISTS (
        SELECT 1
        FROM calendario_facturacion_postventa c
        WHERE c.id_lead = s.id_lead
    )
    RETURNING id, id_lead
)
INSERT INTO tmp_claro_huerfanos_metricas(metric, value)
SELECT 'calendarios_insertados', count(*) FROM calendarios_insertados;

WITH periodos_insertados AS (
    INSERT INTO periodo_facturacion_postventa (
        id_calendario_facturacion,
        id_lead,
        numero_periodo,
        fecha_inicio_periodo,
        fecha_fin_periodo,
        fecha_corte_estimada,
        fecha_emision_estimada,
        fecha_vencimiento_estimado,
        monto_esperado,
        estado,
        observacion,
        created_at,
        updated_at
    )
    SELECT
        c.id,
        s.id_lead,
        1,
        s.fecha_emision_base,
        s.fecha_vencimiento_base,
        s.fecha_emision_base,
        s.fecha_emision_base,
        s.fecha_vencimiento_base,
        s.precio_final,
        'ABIERTO',
        'BACKFILL_CLARO_20260902 | periodo 1 creado para lead huerfano POSTVENTA',
        now(),
        now()
    FROM tmp_claro_huerfanos_scope s
    JOIN calendario_facturacion_postventa c ON c.id_lead = s.id_lead AND c.activo = true
    WHERE NOT EXISTS (
        SELECT 1
        FROM periodo_facturacion_postventa p
        WHERE p.id_lead = s.id_lead
          AND p.numero_periodo = 1
    )
    RETURNING id
)
INSERT INTO tmp_claro_huerfanos_metricas(metric, value)
SELECT 'periodos_uno_insertados', count(*) FROM periodos_insertados;

WITH encuestas_insertadas AS (
    INSERT INTO encuesta_postventa (
        id_lead,
        tipo_encuesta,
        estado,
        prioridad,
        fecha_programada,
        fecha_limite,
        numero_encuesta,
        created_at,
        updated_at
    )
    SELECT
        s.id_lead,
        'SATISFACCION_ASESOR',
        'PENDIENTE',
        'NORMAL',
        now() AT TIME ZONE 'America/Lima',
        (now() AT TIME ZONE 'America/Lima') + interval '48 hours',
        1,
        now(),
        now()
    FROM tmp_claro_huerfanos_scope s
    WHERE NOT EXISTS (
        SELECT 1
        FROM encuesta_postventa e
        WHERE e.id_lead = s.id_lead
          AND e.tipo_encuesta = 'SATISFACCION_ASESOR'
          AND e.numero_encuesta = 1
    )
    RETURNING id
)
INSERT INTO tmp_claro_huerfanos_metricas(metric, value)
SELECT 'encuestas_iniciales_insertadas', count(*) FROM encuestas_insertadas;

SELECT metric, value
FROM tmp_claro_huerfanos_metricas
ORDER BY metric;

SELECT
    c.mes_corte_base,
    c.numero_corte_base,
    count(*) AS calendarios_postventa_claro
FROM lead l
JOIN plan pl ON pl.id = l.id_plan
JOIN proveedor pr ON pr.id = pl.id_proveedor
JOIN calendario_facturacion_postventa c ON c.id_lead = l.id AND c.activo = true
WHERE l.etapa = 'POSTVENTA'
  AND UPPER(TRIM(pr.nombre)) = 'CLARO'
GROUP BY c.mes_corte_base, c.numero_corte_base
ORDER BY c.mes_corte_base, c.numero_corte_base;

SELECT count(*) AS huerfanos_restantes
FROM lead l
JOIN plan pl ON pl.id = l.id_plan
JOIN proveedor pr ON pr.id = pl.id_proveedor
LEFT JOIN calendario_facturacion_postventa c ON c.id_lead = l.id AND c.activo = true
WHERE l.etapa = 'POSTVENTA'
  AND UPPER(TRIM(pr.nombre)) = 'CLARO'
  AND c.id IS NULL;

COMMIT;
