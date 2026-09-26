-- Corrige el primer backfill de Finanzas: las metricas del funnel son del
-- cierre reportado, no el acumulado actual de toda la campana.
-- Solo se recalcula el ultimo registro de cada campana/dia.
WITH registros_ordenados AS (
    SELECT
        g.id,
        g.id_campana,
        g.reported_at,
        ROW_NUMBER() OVER (
            PARTITION BY g.id_campana, g.reported_at::date
            ORDER BY g.reported_at DESC, g.id DESC
        ) AS posicion
    FROM gasto_campana g
),
ultimos AS (
    SELECT id, id_campana, reported_at
    FROM registros_ordenados
    WHERE posicion = 1
),
metricas AS (
    SELECT
        u.id,
        COUNT(DISTINCT CASE
            WHEN l.etapa <> 'PREVENTA'
             AND rp.mayor_rango_codigo_tipificacion = 'PREVENTA'
             AND rp.mayor_rango_at >= (u.reported_at::date::timestamp AT TIME ZONE 'America/Lima')
             AND rp.mayor_rango_at <= (u.reported_at AT TIME ZONE 'America/Lima')
            THEN l.id
        END)::integer AS cantidad_preventas,
        COUNT(DISTINCT CASE
            WHEN l.etapa NOT IN ('PREVENTA', 'VENTA')
             AND rv.mayor_rango_codigo_tipificacion = 'INSTALADO'
             AND rv.mayor_rango_at >= (u.reported_at::date::timestamp AT TIME ZONE 'America/Lima')
             AND rv.mayor_rango_at <= (u.reported_at AT TIME ZONE 'America/Lima')
            THEN l.id
        END)::integer AS cantidad_ventas
    FROM ultimos u
    LEFT JOIN lead l ON l.id_campana = u.id_campana
    LEFT JOIN lead_etapa_resumen rp
        ON rp.id_lead = l.id
       AND rp.etapa = 'PREVENTA'
    LEFT JOIN lead_etapa_resumen rv
        ON rv.id_lead = l.id
       AND rv.etapa = 'VENTA'
    GROUP BY u.id
)
UPDATE gasto_campana g
SET cantidad_preventas = m.cantidad_preventas,
    cantidad_ventas = m.cantidad_ventas
FROM metricas m
WHERE g.id = m.id;

UPDATE gasto_campana g
SET cantidad_ventas = NULL
WHERE g.id NOT IN (
    SELECT DISTINCT ON (id_campana, reported_at::date) id
    FROM gasto_campana
    ORDER BY id_campana, reported_at::date, reported_at DESC, id DESC
);
