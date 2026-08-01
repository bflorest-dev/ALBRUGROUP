-- Validacion de coherencia funcional del backfill POSTVENTA.
-- Debe devolver 0 filas en la primera consulta antes de considerar el backfill correcto.

WITH periodos AS (
    SELECT
        l.id AS id_lead,
        l.lead,
        coalesce(l.numero_documento_titular_servicio_snapshot, dp.numero_documento_titular_servicio) AS documento,
        l.etapa,
        l.estado_cliente_postventa,
        c.mes_corte_base,
        c.numero_corte_base,
        p.numero_periodo,
        p.estado AS estado_periodo,
        p.fecha_vencimiento_confirmado,
        p.fecha_vencimiento_estimado,
        pp.id AS id_pago,
        pp.estado AS estado_pago,
        pp.fecha_pago
    FROM lead l
    LEFT JOIN datos_preventa dp ON dp.id = l.id_datos_preventa
    JOIN calendario_facturacion_postventa c ON c.id_lead = l.id AND c.activo = true
    LEFT JOIN periodo_facturacion_postventa p ON p.id_lead = l.id
    LEFT JOIN pago_postventa pp ON pp.id_periodo_facturacion = p.id
    WHERE c.mes_corte_base BETWEEN date '2026-04-01' AND date '2026-07-01'
),
resumen AS (
    SELECT
        id_lead,
        lead,
        documento,
        etapa,
        estado_cliente_postventa,
        mes_corte_base,
        numero_corte_base,
        count(DISTINCT numero_periodo) FILTER (WHERE estado_periodo = 'ABIERTO') AS periodos_abiertos,
        string_agg(DISTINCT numero_periodo::text, ',' ORDER BY numero_periodo::text)
            FILTER (WHERE estado_periodo = 'ABIERTO') AS numeros_periodos_abiertos,
        bool_or(estado_periodo IN ('CERRADO_BAJA', 'CERRADO_BAJA_ADEUDO')) AS tiene_baja,
        bool_or(numero_periodo = 3 AND estado_periodo IN ('CERRADO_PAGO_CLIENTE', 'CERRADO_PAGO_EMPRESA')) AS tercer_periodo_pagado,
        bool_or(estado_periodo = 'ABIERTO' AND id_pago IS NOT NULL) AS pago_en_periodo_abierto
    FROM periodos
    GROUP BY id_lead, lead, documento, etapa, estado_cliente_postventa, mes_corte_base, numero_corte_base
),
hallazgos AS (
    SELECT
        'MAS_DE_UN_PERIODO_ABIERTO' AS regla,
        id_lead,
        lead,
        documento,
        etapa,
        estado_cliente_postventa,
        mes_corte_base,
        numero_corte_base,
        numeros_periodos_abiertos AS detalle
    FROM resumen
    WHERE periodos_abiertos > 1
    UNION ALL
    SELECT
        'ABRIL_2_DEBE_SALIR_DE_POSTVENTA',
        id_lead,
        lead,
        documento,
        etapa,
        estado_cliente_postventa,
        mes_corte_base,
        numero_corte_base,
        coalesce(numeros_periodos_abiertos, 'sin abiertos')
    FROM resumen
    WHERE mes_corte_base = date '2026-04-01'
      AND numero_corte_base = 2
      AND etapa = 'POSTVENTA'
      AND NOT tiene_baja
    UNION ALL
    SELECT
        'TERCER_PERIODO_PAGADO_DEBE_ESTAR_EN_COBRANZA',
        id_lead,
        lead,
        documento,
        etapa,
        estado_cliente_postventa,
        mes_corte_base,
        numero_corte_base,
        'periodo 3 cerrado con pago'
    FROM resumen
    WHERE tercer_periodo_pagado
      AND NOT tiene_baja
      AND etapa <> 'COBRANZA'
    UNION ALL
    SELECT
        'PAGO_REGISTRADO_EN_PERIODO_ABIERTO',
        id_lead,
        lead,
        documento,
        etapa,
        estado_cliente_postventa,
        mes_corte_base,
        numero_corte_base,
        coalesce(numeros_periodos_abiertos, 'periodo abierto con pago')
    FROM resumen
    WHERE pago_en_periodo_abierto
)
SELECT *
FROM hallazgos
ORDER BY regla, mes_corte_base, numero_corte_base, lead, documento
LIMIT 200;

WITH resumen AS (
    SELECT
        l.id AS id_lead,
        l.etapa,
        l.estado_cliente_postventa,
        c.mes_corte_base,
        c.numero_corte_base
    FROM lead l
    JOIN calendario_facturacion_postventa c ON c.id_lead = l.id AND c.activo = true
    WHERE c.mes_corte_base BETWEEN date '2026-04-01' AND date '2026-07-01'
)
SELECT
    mes_corte_base,
    numero_corte_base,
    etapa,
    estado_cliente_postventa,
    count(*) AS leads
FROM resumen
GROUP BY mes_corte_base, numero_corte_base, etapa, estado_cliente_postventa
ORDER BY mes_corte_base, numero_corte_base, etapa, estado_cliente_postventa;
