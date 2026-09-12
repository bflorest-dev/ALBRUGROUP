-- =====================================================================
-- Backfill: crea CalendarioFacturacionPostventa + Periodo 1 + Encuesta
-- para leads en POSTVENTA (proveedor WIN) que no tienen calendario.
--
-- Estos leads llegaron a POSTVENTA antes de que existiera la logica
-- de calendario. Se reconstruyen usando la fecha_instalacion registrada
-- en la tabla evento (evento de tipificacion INSTALADO).
--
-- Solo WIN (3005 leads). PERUFIBRA (19) y MIFIBRA (1) se ignoran:
-- no tienen calculadora implementada.
-- =====================================================================

-- Paso 1: Insertar calendarios usando las reglas de CalculadoraFacturacionWin
--   - dia <= 22 => corte 1, MISMO_MES
--   - dia >= 23 => corte 2, MES_SIGUIENTE
--   - dia_corte = 23, dia_vencimiento = 28
INSERT INTO calendario_facturacion_postventa (
    id_lead,
    fecha_instalacion,
    proveedor_snapshot,
    plan_snapshot,
    meses_permanencia_snapshot,
    monto_plan_snapshot,
    tipo_regla_proveedor,
    dia_corte,
    dia_vencimiento,
    mes_corte_base,
    numero_corte_base,
    bloque_facturacion,
    requiere_prorrateo_inicial,
    activo,
    created_at
)
SELECT
    l.id,
    fi.fecha_instalacion,
    l.nombre_proveedor_snapshot,
    l.nombre_plan_snapshot,
    l.meses_permanencia_snapshot,
    l.precio_final,
    'WIN',
    23,
    28,
    DATE_TRUNC('month', fi.fecha_instalacion)::date,
    CASE WHEN EXTRACT(DAY FROM fi.fecha_instalacion) <= 22 THEN 1 ELSE 2 END,
    CASE WHEN EXTRACT(DAY FROM fi.fecha_instalacion) <= 22 THEN 'MISMO_MES' ELSE 'MES_SIGUIENTE' END,
    true,
    true,
    fi.created_at_evento
FROM lead l
JOIN LATERAL (
    SELECT e.fecha_instalacion, e.created_at AS created_at_evento
    FROM evento e
    WHERE e.id_lead = l.id AND e.fecha_instalacion IS NOT NULL
    ORDER BY e.created_at DESC
    LIMIT 1
) fi ON TRUE
WHERE l.etapa IN ('POSTVENTA', 'COBRANZA')
  AND UPPER(TRIM(COALESCE(l.nombre_proveedor_snapshot, ''))) = 'WIN'
  AND NOT EXISTS (
      SELECT 1 FROM calendario_facturacion_postventa c WHERE c.id_lead = l.id
  );

-- Paso 2: Insertar periodo 1 (ABIERTO) para cada calendario recien creado.
-- Vencimiento: dia 28 del mes correspondiente segun bloque.
INSERT INTO periodo_facturacion_postventa (
    id_calendario_facturacion,
    id_lead,
    numero_periodo,
    fecha_inicio_periodo,
    fecha_fin_periodo,
    fecha_corte_estimada,
    fecha_vencimiento_estimado,
    monto_esperado,
    estado,
    created_at
)
SELECT
    c.id,
    c.id_lead,
    1,
    CASE
        WHEN c.numero_corte_base = 2
            THEN (c.mes_corte_base + INTERVAL '22 days')::date
        ELSE c.mes_corte_base
    END,
    CASE
        WHEN c.numero_corte_base = 2
            THEN MAKE_DATE(
                EXTRACT(YEAR FROM c.mes_corte_base + INTERVAL '1 month')::int,
                EXTRACT(MONTH FROM c.mes_corte_base + INTERVAL '1 month')::int,
                28
            )
        ELSE MAKE_DATE(
                EXTRACT(YEAR FROM c.mes_corte_base)::int,
                EXTRACT(MONTH FROM c.mes_corte_base)::int,
                28
            )
    END,
    CASE
        WHEN c.numero_corte_base = 2
            THEN MAKE_DATE(
                EXTRACT(YEAR FROM c.mes_corte_base + INTERVAL '1 month')::int,
                EXTRACT(MONTH FROM c.mes_corte_base + INTERVAL '1 month')::int,
                23
            )
        ELSE MAKE_DATE(
                EXTRACT(YEAR FROM c.mes_corte_base)::int,
                EXTRACT(MONTH FROM c.mes_corte_base)::int,
                23
            )
    END,
    CASE
        WHEN c.numero_corte_base = 2
            THEN MAKE_DATE(
                EXTRACT(YEAR FROM c.mes_corte_base + INTERVAL '1 month')::int,
                EXTRACT(MONTH FROM c.mes_corte_base + INTERVAL '1 month')::int,
                28
            )
        ELSE MAKE_DATE(
                EXTRACT(YEAR FROM c.mes_corte_base)::int,
                EXTRACT(MONTH FROM c.mes_corte_base)::int,
                28
            )
    END,
    c.monto_plan_snapshot,
    'ABIERTO',
    c.created_at
FROM calendario_facturacion_postventa c
WHERE NOT EXISTS (
    SELECT 1 FROM periodo_facturacion_postventa p WHERE p.id_lead = c.id_lead
);

-- Paso 3: Insertar encuesta inicial (SATISFACCION_ASESOR, PENDIENTE)
-- para cada lead que ahora tiene calendario pero no tiene encuesta.
INSERT INTO encuesta_postventa (
    id_lead,
    tipo_encuesta,
    estado,
    prioridad,
    fecha_programada,
    fecha_limite,
    numero_encuesta,
    created_at
)
SELECT
    c.id_lead,
    'SATISFACCION_ASESOR',
    'PENDIENTE',
    'NORMAL',
    c.created_at,
    c.created_at + INTERVAL '48 hours',
    1,
    c.created_at
FROM calendario_facturacion_postventa c
WHERE NOT EXISTS (
    SELECT 1 FROM encuesta_postventa ep WHERE ep.id_lead = c.id_lead
);
