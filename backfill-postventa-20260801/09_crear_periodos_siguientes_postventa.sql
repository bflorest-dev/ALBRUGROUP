\set ON_ERROR_STOP on

-- Backfill POSTVENTA 2026-08-01 / Script 09
-- Objetivo: replicar el comportamiento organico post-pago.
-- Cuando un periodo se cierra por pago y aun no completa permanencia,
-- debe existir el siguiente periodo ABIERTO.

BEGIN;

CREATE TEMP TABLE tmp_postventa_next_period_metrics(
    metric text PRIMARY KEY,
    value integer NOT NULL
) ON COMMIT DROP;

WITH scope AS (
    SELECT
        l.id AS id_lead,
        c.id AS id_calendario,
        c.mes_corte_base,
        c.numero_corte_base,
        COALESCE(c.meses_permanencia_snapshot, 3) AS permanencia
    FROM lead l
    JOIN calendario_facturacion_postventa c ON c.id_lead = l.id AND c.activo = true
    WHERE c.proveedor_snapshot = 'WIN'
      AND (
          (c.mes_corte_base = date '2026-04-01' AND c.numero_corte_base = 2)
          OR (c.mes_corte_base = date '2026-05-01' AND c.numero_corte_base IN (1, 2))
          OR (c.mes_corte_base = date '2026-06-01' AND c.numero_corte_base IN (1, 2))
          OR (c.mes_corte_base = date '2026-07-01' AND c.numero_corte_base = 1)
      )
), missing_next_period_src AS (
    SELECT
        p.id_lead,
        p.id_calendario_facturacion,
        p.numero_periodo + 1 AS numero_periodo,
        c.monto_plan_snapshot,
        (
            (CASE WHEN c.numero_corte_base = 2
                THEN c.mes_corte_base + interval '1 month'
                ELSE c.mes_corte_base
            END)::date + interval '27 days'
        )::date AS primer_vencimiento
    FROM scope s
    JOIN periodo_facturacion_postventa p ON p.id_lead = s.id_lead
    JOIN calendario_facturacion_postventa c ON c.id = p.id_calendario_facturacion
    JOIN lead l ON l.id = p.id_lead
    WHERE p.estado IN ('CERRADO_PAGO_CLIENTE', 'CERRADO_PAGO_EMPRESA')
      AND p.numero_periodo < s.permanencia
      AND l.estado_cliente_postventa <> 'BAJA'
      AND NOT EXISTS (
          SELECT 1
          FROM periodo_facturacion_postventa nx
          WHERE nx.id_lead = p.id_lead
            AND nx.numero_periodo = p.numero_periodo + 1
      )
), missing_next_period_calc AS (
    SELECT
        src.*,
        (src.primer_vencimiento + ((src.numero_periodo - 1) * interval '1 month'))::date AS fecha_vencimiento
    FROM missing_next_period_src src
), missing_next_period_insert AS (
    INSERT INTO periodo_facturacion_postventa (
        id_calendario_facturacion, id_lead, numero_periodo,
        fecha_inicio_periodo, fecha_fin_periodo, fecha_corte_estimada,
        fecha_vencimiento_estimado, monto_esperado, estado,
        observacion, created_at, updated_at
    )
    SELECT
        id_calendario_facturacion,
        id_lead,
        numero_periodo,
        (fecha_vencimiento - interval '1 month' + interval '1 day')::date,
        fecha_vencimiento,
        (date_trunc('month', fecha_vencimiento)::date + interval '22 days')::date,
        fecha_vencimiento,
        monto_plan_snapshot,
        'ABIERTO',
        'BACKFILL_POSTVENTA_20260801_REPAIR | periodo siguiente abierto por pago confirmado previo',
        now(),
        now()
    FROM missing_next_period_calc
    RETURNING id
)
INSERT INTO tmp_postventa_next_period_metrics(metric, value)
SELECT 'periodos_siguientes_abiertos_insertados', count(*) FROM missing_next_period_insert;

DO $$
DECLARE
    v_faltantes integer;
BEGIN
    WITH scope AS (
        SELECT
            l.id AS id_lead,
            c.id AS id_calendario,
            COALESCE(c.meses_permanencia_snapshot, 3) AS permanencia
        FROM lead l
        JOIN calendario_facturacion_postventa c ON c.id_lead = l.id AND c.activo = true
        WHERE c.proveedor_snapshot = 'WIN'
          AND (
              (c.mes_corte_base = date '2026-04-01' AND c.numero_corte_base = 2)
              OR (c.mes_corte_base = date '2026-05-01' AND c.numero_corte_base IN (1, 2))
              OR (c.mes_corte_base = date '2026-06-01' AND c.numero_corte_base IN (1, 2))
              OR (c.mes_corte_base = date '2026-07-01' AND c.numero_corte_base = 1)
          )
    )
    SELECT count(*) INTO v_faltantes
    FROM scope s
    JOIN periodo_facturacion_postventa p ON p.id_lead = s.id_lead
    JOIN lead l ON l.id = p.id_lead
    WHERE p.estado IN ('CERRADO_PAGO_CLIENTE', 'CERRADO_PAGO_EMPRESA')
      AND p.numero_periodo < s.permanencia
      AND l.estado_cliente_postventa <> 'BAJA'
      AND NOT EXISTS (
          SELECT 1
          FROM periodo_facturacion_postventa nx
          WHERE nx.id_lead = p.id_lead
            AND nx.numero_periodo = p.numero_periodo + 1
      );

    IF v_faltantes > 0 THEN
        RAISE EXCEPTION 'Backfill POSTVENTA incoherente: periodos siguientes faltantes=%', v_faltantes;
    END IF;
END $$;

SELECT * FROM tmp_postventa_next_period_metrics ORDER BY metric;

COMMIT;
