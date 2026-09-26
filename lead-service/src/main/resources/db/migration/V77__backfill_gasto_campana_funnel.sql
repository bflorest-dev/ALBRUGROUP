-- Backfill one-time de los cierres financieros despues de la evolucion de GastoCampana.
--
-- Los registros intermedios conservan cantidad_preventas (migrada desde
-- ventas_cerradas) y quedan con cantidad_ventas NULL. Solo el ultimo registro
-- por campana y dia se recalcula contra el estado actual de Lead y LeadEtapaResumen.
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
    SELECT id, id_campana
    FROM registros_ordenados
    WHERE posicion = 1
),
metricas AS (
    SELECT
        u.id,
        COUNT(DISTINCT CASE
            WHEN l.etapa <> 'PREVENTA'
             AND rp.mayor_rango_codigo_tipificacion = 'PREVENTA'
            THEN l.id
        END)::integer AS cantidad_preventas,
        COUNT(DISTINCT CASE
            WHEN l.etapa NOT IN ('PREVENTA', 'VENTA')
             AND rv.mayor_rango_codigo_tipificacion = 'INSTALADO'
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

WITH registros_ordenados AS (
    SELECT
        g.id,
        ROW_NUMBER() OVER (
            PARTITION BY g.id_campana, g.reported_at::date
            ORDER BY g.reported_at DESC, g.id DESC
        ) AS posicion
    FROM gasto_campana g
)
UPDATE gasto_campana g
SET cantidad_ventas = NULL
FROM registros_ordenados r
WHERE g.id = r.id
  AND r.posicion > 1;
