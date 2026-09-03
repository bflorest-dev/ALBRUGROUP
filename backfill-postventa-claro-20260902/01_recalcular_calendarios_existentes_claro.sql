BEGIN;

CREATE TEMP TABLE tmp_claro_recalculo_metricas (
    metric text PRIMARY KEY,
    value integer NOT NULL
) ON COMMIT DROP;

CREATE TEMP TABLE tmp_claro_calendario_scope AS
SELECT
    l.id AS id_lead,
    c.id AS id_calendario,
    c.fecha_instalacion,
    date_trunc('month', c.fecha_instalacion)::date AS mes_corte_base_esperado,
    CASE WHEN EXTRACT(DAY FROM c.fecha_instalacion) >= 12 THEN 2 ELSE 1 END AS numero_corte_base_esperado,
    CASE WHEN EXTRACT(DAY FROM c.fecha_instalacion) >= 12 THEN 12 ELSE 1 END AS dia_corte_esperado,
    c.fecha_instalacion AS fecha_emision_base,
    (c.fecha_instalacion + interval '15 days')::date AS fecha_vencimiento_base
FROM lead l
JOIN plan pl ON pl.id = l.id_plan
JOIN proveedor pr ON pr.id = pl.id_proveedor
JOIN calendario_facturacion_postventa c ON c.id_lead = l.id AND c.activo = true
WHERE l.etapa = 'POSTVENTA'
  AND UPPER(TRIM(pr.nombre)) = 'CLARO'
  AND c.fecha_instalacion IS NOT NULL
  AND COALESCE(c.corte_corregido, false) = false;

INSERT INTO tmp_claro_recalculo_metricas(metric, value)
SELECT 'calendarios_claro_scope', count(*) FROM tmp_claro_calendario_scope;

WITH actualizados AS (
    UPDATE calendario_facturacion_postventa c
    SET
        proveedor_snapshot = 'CLARO',
        tipo_regla_proveedor = 'CLARO',
        dia_corte = s.dia_corte_esperado,
        dia_emision_estimado = EXTRACT(DAY FROM s.fecha_emision_base)::integer,
        dia_vencimiento = EXTRACT(DAY FROM s.fecha_vencimiento_base)::integer,
        mes_corte_base = s.mes_corte_base_esperado,
        numero_corte_base = s.numero_corte_base_esperado,
        bloque_facturacion = CASE
            WHEN s.numero_corte_base_esperado = 2 THEN 'MES_SIGUIENTE'
            ELSE 'MISMO_MES'
        END,
        requiere_prorrateo_inicial = true,
        updated_at = now(),
        observacion = CASE
            WHEN NULLIF(c.observacion, '') IS NULL THEN 'RECALCULO_CLARO_20260902 | corte operativo recalculado'
            WHEN c.observacion LIKE '%RECALCULO_CLARO_20260902%' THEN c.observacion
            ELSE concat(c.observacion, ' | RECALCULO_CLARO_20260902: corte operativo recalculado')
        END
    FROM tmp_claro_calendario_scope s
    WHERE c.id = s.id_calendario
      AND (
          c.proveedor_snapshot IS DISTINCT FROM 'CLARO'
          OR c.tipo_regla_proveedor IS DISTINCT FROM 'CLARO'
          OR c.dia_corte IS DISTINCT FROM s.dia_corte_esperado
          OR c.dia_emision_estimado IS DISTINCT FROM EXTRACT(DAY FROM s.fecha_emision_base)::integer
          OR c.dia_vencimiento IS DISTINCT FROM EXTRACT(DAY FROM s.fecha_vencimiento_base)::integer
          OR c.mes_corte_base IS DISTINCT FROM s.mes_corte_base_esperado
          OR c.numero_corte_base IS DISTINCT FROM s.numero_corte_base_esperado
          OR c.bloque_facturacion IS DISTINCT FROM CASE
              WHEN s.numero_corte_base_esperado = 2 THEN 'MES_SIGUIENTE'
              ELSE 'MISMO_MES'
          END
          OR c.requiere_prorrateo_inicial IS DISTINCT FROM true
      )
    RETURNING c.id
)
INSERT INTO tmp_claro_recalculo_metricas(metric, value)
SELECT 'calendarios_actualizados', count(*) FROM actualizados;

CREATE TEMP TABLE tmp_claro_periodo_recalculable AS
SELECT
    p.id AS id_periodo,
    p.numero_periodo,
    p.monto_esperado,
    c.monto_plan_snapshot,
    (c.fecha_instalacion + ((p.numero_periodo - 1) * interval '1 month'))::date AS fecha_emision_esperada,
    (c.fecha_instalacion + ((p.numero_periodo - 1) * interval '1 month') + interval '15 days')::date AS fecha_vencimiento_esperada
FROM tmp_claro_calendario_scope s
JOIN calendario_facturacion_postventa c ON c.id = s.id_calendario
JOIN periodo_facturacion_postventa p ON p.id_calendario_facturacion = c.id
WHERE p.numero_periodo IS NOT NULL
  AND p.estado = 'ABIERTO'
  AND p.fecha_emision_confirmada IS NULL
  AND p.fecha_vencimiento_confirmado IS NULL
  AND p.monto_facturado IS NULL
  AND NOT EXISTS (
      SELECT 1
      FROM pago_postventa pp
      WHERE pp.id_periodo_facturacion = p.id
  );

INSERT INTO tmp_claro_recalculo_metricas(metric, value)
SELECT 'periodos_abiertos_sin_gestion_scope', count(*) FROM tmp_claro_periodo_recalculable;

WITH actualizados AS (
    UPDATE periodo_facturacion_postventa p
    SET
        fecha_inicio_periodo = r.fecha_emision_esperada,
        fecha_fin_periodo = r.fecha_vencimiento_esperada,
        fecha_corte_estimada = r.fecha_emision_esperada,
        fecha_emision_estimada = r.fecha_emision_esperada,
        fecha_vencimiento_estimado = r.fecha_vencimiento_esperada,
        monto_esperado = COALESCE(r.monto_plan_snapshot, p.monto_esperado),
        updated_at = now(),
        observacion = CASE
            WHEN NULLIF(p.observacion, '') IS NULL THEN 'RECALCULO_CLARO_20260902 | estimados recalculados'
            WHEN p.observacion LIKE '%RECALCULO_CLARO_20260902%' THEN p.observacion
            ELSE concat(p.observacion, ' | RECALCULO_CLARO_20260902: estimados recalculados')
        END
    FROM tmp_claro_periodo_recalculable r
    WHERE p.id = r.id_periodo
      AND (
          p.fecha_inicio_periodo IS DISTINCT FROM r.fecha_emision_esperada
          OR p.fecha_fin_periodo IS DISTINCT FROM r.fecha_vencimiento_esperada
          OR p.fecha_corte_estimada IS DISTINCT FROM r.fecha_emision_esperada
          OR p.fecha_emision_estimada IS DISTINCT FROM r.fecha_emision_esperada
          OR p.fecha_vencimiento_estimado IS DISTINCT FROM r.fecha_vencimiento_esperada
          OR p.monto_esperado IS DISTINCT FROM COALESCE(r.monto_plan_snapshot, p.monto_esperado)
      )
    RETURNING p.id
)
INSERT INTO tmp_claro_recalculo_metricas(metric, value)
SELECT 'periodos_estimados_actualizados', count(*) FROM actualizados;

SELECT metric, value
FROM tmp_claro_recalculo_metricas
ORDER BY metric;

SELECT
    mes_corte_base,
    numero_corte_base,
    count(*) AS calendarios
FROM calendario_facturacion_postventa c
JOIN tmp_claro_calendario_scope s ON s.id_calendario = c.id
GROUP BY mes_corte_base, numero_corte_base
ORDER BY mes_corte_base, numero_corte_base;

COMMIT;
