-- Backfill acotado del cableado anterior de retornos desde VENTA.
-- No reconstruye historia: solo remapea el par obsoleto PREVENTA / DESAPROBADA al nuevo descarte.

WITH destino AS (
    SELECT t.id_equipo,
           t.id AS id_tipificacion,
           t.codigo AS codigo_tipificacion,
           t.orden AS orden_tipificacion,
           s.id AS id_subtipificacion,
           s.codigo AS codigo_subtipificacion
    FROM tipificacion t
    JOIN subtipificacion s ON s.tipificacion_id = t.id
    WHERE t.etapa = 'PREVENTA'
      AND t.codigo = 'NO DESEA'
      AND s.codigo = 'PREVENTA DESAPROBADA'
      AND t.activo = TRUE
      AND s.activo = TRUE
)
UPDATE lead_etapa_resumen r
SET ultima_codigo_tipificacion = d.codigo_tipificacion,
    ultima_codigo_subtipificacion = d.codigo_subtipificacion,
    ultima_tipificacion_orden = d.orden_tipificacion
FROM lead l
JOIN destino d ON d.id_equipo = l.id_equipo
WHERE l.id = r.id_lead
  AND r.etapa = 'PREVENTA'
  AND r.ultima_codigo_tipificacion = 'PREVENTA'
  AND r.ultima_codigo_subtipificacion IN ('DESAPROBADA', 'DESAPROBADO');

WITH destino AS (
    SELECT t.id_equipo,
           t.codigo AS codigo_tipificacion,
           t.orden AS orden_tipificacion,
           s.codigo AS codigo_subtipificacion
    FROM tipificacion t
    JOIN subtipificacion s ON s.tipificacion_id = t.id
    WHERE t.etapa = 'PREVENTA'
      AND t.codigo = 'NO DESEA'
      AND s.codigo = 'PREVENTA DESAPROBADA'
      AND t.activo = TRUE
      AND s.activo = TRUE
)
UPDATE lead_etapa_resumen r
SET mayor_rango_codigo_tipificacion = d.codigo_tipificacion,
    mayor_rango_codigo_subtipificacion = d.codigo_subtipificacion,
    mayor_rango_orden = d.orden_tipificacion
FROM lead l
JOIN destino d ON d.id_equipo = l.id_equipo
WHERE l.id = r.id_lead
  AND r.etapa = 'PREVENTA'
  AND r.mayor_rango_codigo_tipificacion = 'PREVENTA'
  AND r.mayor_rango_codigo_subtipificacion IN ('DESAPROBADA', 'DESAPROBADO');

WITH destino AS (
    SELECT t.id_equipo,
           t.id AS id_tipificacion,
           t.codigo AS codigo_tipificacion,
           s.id AS id_subtipificacion,
           s.codigo AS codigo_subtipificacion
    FROM tipificacion t
    JOIN subtipificacion s ON s.tipificacion_id = t.id
    WHERE t.etapa = 'PREVENTA'
      AND t.codigo = 'NO DESEA'
      AND s.codigo = 'PREVENTA DESAPROBADA'
      AND t.activo = TRUE
      AND s.activo = TRUE
)
UPDATE lead l
SET id_tipificacion = d.id_tipificacion,
    codigo_tipificacion = d.codigo_tipificacion,
    id_subtipificacion = d.id_subtipificacion,
    codigo_subtipificacion = d.codigo_subtipificacion
FROM destino d
WHERE d.id_equipo = l.id_equipo
  AND l.etapa = 'PREVENTA'
  AND l.codigo_tipificacion = 'PREVENTA'
  AND l.codigo_subtipificacion IN ('DESAPROBADA', 'DESAPROBADO');
