-- Revierte una tipificacion BAJA/FINALIZADA aplicada por error al lead 975488830.
-- Solo elimina la tipificacion BAJA y la asignacion inmediatamente posterior,
-- reabre el ultimo periodo y restaura el estado operativo anterior.

BEGIN;

CREATE TEMP TABLE _revert_baja_lead ON COMMIT DROP AS
WITH lead_target AS (
    SELECT l.*
    FROM lead l
    WHERE l.lead = '975488830'
), baja_all AS (
    SELECT e.*
    FROM evento e
    JOIN lead_target l ON l.id = e.id_lead
    WHERE e.accion = 'TIPIFICACION'
      AND e.etapa = 'POSTVENTA'
      AND e.tipificacion = 'BAJA'
      AND e.subtipificacion = 'FINALIZADA'
      AND e.tipificacion_resultado = 'BAJA'
      AND e.subtipificacion_resultado = 'FINALIZADA'
), baja_stats AS (
    SELECT
        l.id AS id_lead,
        count(b.id) AS baja_count
    FROM lead_target l
    LEFT JOIN baja_all b ON b.id_lead = l.id
    GROUP BY l.id
), baja_target AS (
    SELECT DISTINCT ON (b.id_lead)
        b.id_lead,
        b.id AS baja_event_id,
        b.created_at AS baja_at
    FROM baja_all b
    ORDER BY b.id_lead, b.created_at DESC, b.id DESC
), post_baja AS (
    SELECT
        b.id_lead,
        count(e.id) AS post_count,
        count(*) FILTER (WHERE e.accion = 'ASIGNACION') AS post_assignment_count,
        max(e.id) FILTER (WHERE e.accion = 'ASIGNACION') AS post_assignment_id
    FROM baja_target b
    LEFT JOIN evento e
      ON e.id_lead = b.id_lead
     AND e.created_at > b.baja_at
    GROUP BY b.id_lead
), previous_tip AS (
    SELECT DISTINCT ON (e.id_lead)
        e.id_lead,
        e.id AS event_id,
        e.id_actor,
        e.nombre_actor,
        e.created_at,
        tr.id AS tipificacion_id,
        tr.codigo AS tipificacion_codigo,
        tr.orden AS tipificacion_orden,
        sr.id AS subtipificacion_id,
        sr.codigo AS subtipificacion_codigo
    FROM evento e
    JOIN baja_target b
      ON b.id_lead = e.id_lead
     AND e.created_at < b.baja_at
    JOIN tipificacion tr ON tr.id = e.id_tipificacion_resultado
    JOIN subtipificacion sr ON sr.id = e.id_subtipificacion_resultado
    WHERE e.accion = 'TIPIFICACION'
      AND e.etapa = 'POSTVENTA'
    ORDER BY e.id_lead, e.created_at DESC, e.id DESC
), previous_high AS (
    SELECT *
    FROM (
        SELECT
            e.id_lead,
            e.id AS event_id,
            e.created_at,
            tr.codigo AS tipificacion_codigo,
            tr.orden AS tipificacion_orden,
            sr.codigo AS subtipificacion_codigo,
            row_number() OVER (
                PARTITION BY e.id_lead
                ORDER BY tr.orden DESC NULLS LAST, e.created_at DESC, e.id DESC
            ) AS rn
        FROM evento e
        JOIN baja_target b
          ON b.id_lead = e.id_lead
         AND e.created_at < b.baja_at
        JOIN tipificacion tr ON tr.id = e.id_tipificacion_resultado
        JOIN subtipificacion sr ON sr.id = e.id_subtipificacion_resultado
        WHERE e.accion = 'TIPIFICACION'
          AND e.etapa = 'POSTVENTA'
    ) ranked
    WHERE rn = 1
), previous_assignment AS (
    SELECT DISTINCT ON (e.id_lead)
        e.id_lead,
        e.id AS event_id,
        e.id_asesor_asignado,
        e.nombre_asesor_asignado,
        e.created_at
    FROM evento e
    JOIN baja_target b
      ON b.id_lead = e.id_lead
     AND e.created_at < b.baja_at
    WHERE e.accion = 'ASIGNACION'
    ORDER BY e.id_lead, e.created_at DESC, e.id DESC
), previous_comment AS (
    SELECT DISTINCT ON (e.id_lead)
        e.id_lead,
        e.comentario
    FROM evento e
    JOIN baja_target b
      ON b.id_lead = e.id_lead
     AND e.created_at < b.baja_at
    WHERE e.comentario IS NOT NULL
      AND btrim(e.comentario) <> ''
    ORDER BY e.id_lead, e.created_at DESC, e.id DESC
), latest_period AS (
    SELECT DISTINCT ON (p.id_lead)
        p.id_lead,
        p.id AS periodo_id,
        p.numero_periodo,
        p.estado AS periodo_estado,
        p.fecha_cierre,
        p.monto_facturado
    FROM periodo_facturacion_postventa p
    JOIN lead_target l ON l.id = p.id_lead
    ORDER BY p.id_lead, p.numero_periodo DESC, p.id DESC
), open_periods AS (
    SELECT p.id_lead, count(*) AS abiertos
    FROM periodo_facturacion_postventa p
    JOIN lead_target l ON l.id = p.id_lead
    WHERE p.estado = 'ABIERTO'
    GROUP BY p.id_lead
), resumen AS (
    SELECT r.*
    FROM lead_etapa_resumen r
    JOIN lead_target l ON l.id = r.id_lead
    WHERE r.etapa = 'POSTVENTA'
)
SELECT
    l.id AS id_lead,
    l.estado AS lead_estado,
    l.estado_cliente_postventa,
    l.codigo_tipificacion AS lead_tipificacion_actual,
    bs.baja_count,
    b.baja_event_id,
    b.baja_at,
    pb.post_count,
    pb.post_assignment_count,
    pb.post_assignment_id,
    pt.event_id AS previous_tip_event_id,
    pt.id_actor AS previous_tip_actor_id,
    pt.nombre_actor AS previous_tip_actor_name,
    pt.created_at AS previous_tip_at,
    pt.tipificacion_id AS previous_tipificacion_id,
    pt.tipificacion_codigo AS previous_tipificacion_codigo,
    pt.tipificacion_orden AS previous_tipificacion_orden,
    pt.subtipificacion_id AS previous_subtipificacion_id,
    pt.subtipificacion_codigo AS previous_subtipificacion_codigo,
    ph.event_id AS previous_high_event_id,
    ph.created_at AS previous_high_at,
    ph.tipificacion_codigo AS previous_high_tipificacion_codigo,
    ph.tipificacion_orden AS previous_high_tipificacion_orden,
    ph.subtipificacion_codigo AS previous_high_subtipificacion_codigo,
    pa.event_id AS previous_assignment_event_id,
    pa.id_asesor_asignado AS previous_assignment_asesor_id,
    pa.nombre_asesor_asignado AS previous_assignment_asesor_name,
    pa.created_at AS previous_assignment_at,
    pc.comentario AS previous_comentario,
    lp.periodo_id,
    lp.numero_periodo,
    lp.periodo_estado,
    lp.fecha_cierre AS periodo_fecha_cierre,
    op.abiertos AS periodos_abiertos,
    r.id AS resumen_id,
    r.total_tipificaciones,
    r.total_asignaciones
FROM lead_target l
JOIN baja_stats bs ON bs.id_lead = l.id
JOIN baja_target b ON b.id_lead = l.id
JOIN post_baja pb ON pb.id_lead = l.id
LEFT JOIN previous_tip pt ON pt.id_lead = l.id
LEFT JOIN previous_high ph ON ph.id_lead = l.id
LEFT JOIN previous_assignment pa ON pa.id_lead = l.id
LEFT JOIN previous_comment pc ON pc.id_lead = l.id
LEFT JOIN latest_period lp ON lp.id_lead = l.id
LEFT JOIN open_periods op ON op.id_lead = l.id
LEFT JOIN resumen r ON r.id_lead = l.id;

DO $$
DECLARE
    v_rows integer;
    v_bad text;
BEGIN
    SELECT count(*) INTO v_rows FROM _revert_baja_lead;
    IF v_rows = 0 THEN
        -- Idempotencia: si ya fue revertido, no tocar nada.
        IF EXISTS (
            SELECT 1
            FROM lead l
            WHERE l.lead = '975488830'
              AND l.estado_cliente_postventa = 'ACTIVO'
              AND NOT EXISTS (
                  SELECT 1
                  FROM evento e
                  WHERE e.id_lead = l.id
                    AND e.accion = 'TIPIFICACION'
                    AND e.tipificacion = 'BAJA'
                    AND e.subtipificacion = 'FINALIZADA'
              )
              AND NOT EXISTS (
                  SELECT 1
                  FROM periodo_facturacion_postventa p
                  WHERE p.id_lead = l.id
                    AND p.estado = 'CERRADO_BAJA'
              )
        ) THEN
            RAISE NOTICE 'El lead 975488830 ya esta revertido; no se modifica ninguna fila.';
            RETURN;
        END IF;
        RAISE EXCEPTION 'Lead 975488830 no encontrado o sin una baja reversible';
    END IF;

    IF v_rows <> 1 THEN
        RAISE EXCEPTION 'Lead 975488830 no resuelto de forma unica: % fila(s)', v_rows;
    END IF;

    SELECT string_agg(id_lead::text, ', ')
    INTO v_bad
    FROM _revert_baja_lead
    WHERE baja_count <> 1
       OR post_count <> 1
       OR post_assignment_count <> 1
       OR previous_tip_event_id IS NULL
       OR previous_high_event_id IS NULL
       OR previous_assignment_event_id IS NULL
       OR previous_comentario IS NULL
       OR periodo_id IS NULL
       OR periodo_estado <> 'CERRADO_BAJA'
       OR periodos_abiertos IS NOT NULL
       OR resumen_id IS NULL
       OR estado_cliente_postventa <> 'BAJA'
       OR lead_tipificacion_actual <> 'BAJA'
       OR total_tipificaciones < 1
       OR total_asignaciones < 1;

    IF v_bad IS NOT NULL THEN
        RAISE EXCEPTION 'Precondiciones inesperadas para lead(s): %', v_bad;
    END IF;
END $$;

-- Restaurar el snapshot operativo anterior a la baja.
UPDATE lead l
SET id_tipificacion = t.previous_tipificacion_id,
    codigo_tipificacion = t.previous_tipificacion_codigo,
    id_subtipificacion = t.previous_subtipificacion_id,
    codigo_subtipificacion = t.previous_subtipificacion_codigo,
    estado_cliente_postventa = 'ACTIVO',
    id_asesor_asignado = t.previous_assignment_asesor_id,
    nombre_asesor_asignado = t.previous_assignment_asesor_name,
    last_entry_at = t.previous_assignment_at,
    comentario = t.previous_comentario,
    updated_at = CURRENT_TIMESTAMP
FROM _revert_baja_lead t
WHERE l.id = t.id_lead;

-- La baja habia sellado esta fecha; una reapertura la elimina.
UPDATE lead_seguimiento s
SET fecha_baja = NULL,
    updated_at = CURRENT_TIMESTAMP
FROM _revert_baja_lead t
WHERE s.id_lead = t.id_lead;

-- Reabrir el ultimo periodo, conservando sus importes y fechas de facturacion.
UPDATE periodo_facturacion_postventa p
SET estado = 'ABIERTO',
    fecha_cierre = NULL,
    updated_at = CURRENT_TIMESTAMP
FROM _revert_baja_lead t
WHERE p.id = t.periodo_id;

-- Revertir la metadata de POSTVENTA al ultimo evento valido anterior a la baja.
UPDATE lead_etapa_resumen r
SET total_tipificaciones = r.total_tipificaciones - 1,
    total_asignaciones = r.total_asignaciones - 1,
    ultima_codigo_tipificacion = t.previous_tipificacion_codigo,
    ultima_codigo_subtipificacion = t.previous_subtipificacion_codigo,
    ultima_tipificacion_orden = t.previous_tipificacion_orden,
    ultima_tipificacion_at = t.previous_tip_at,
    mayor_rango_codigo_tipificacion = t.previous_high_tipificacion_codigo,
    mayor_rango_codigo_subtipificacion = t.previous_high_subtipificacion_codigo,
    mayor_rango_orden = t.previous_high_tipificacion_orden,
    mayor_rango_at = t.previous_high_at,
    id_asesor_ultima_gestion = t.previous_tip_actor_id,
    nombre_asesor_ultima_gestion = t.previous_tip_actor_name,
    fecha_ultima_gestion = t.previous_tip_at,
    updated_at = CURRENT_TIMESTAMP
FROM _revert_baja_lead t
WHERE r.id = t.resumen_id;

-- Eliminar solo la baja y la asignacion generada inmediatamente despues.
DELETE FROM evento e
USING _revert_baja_lead t
WHERE e.id = t.baja_event_id
   OR e.id = t.post_assignment_id;

-- Validaciones posteriores.
SELECT
    l.id,
    l.lead,
    l.etapa,
    l.estado,
    l.estado_cliente_postventa,
    l.codigo_tipificacion,
    l.codigo_subtipificacion,
    s.fecha_baja,
    p.id AS ultimo_periodo_id,
    p.numero_periodo,
    p.estado AS ultimo_periodo_estado,
    p.fecha_cierre,
    r.total_tipificaciones,
    r.total_asignaciones
FROM lead l
JOIN lead_seguimiento s ON s.id_lead = l.id
JOIN periodo_facturacion_postventa p
  ON p.id_lead = l.id
 AND p.numero_periodo = (SELECT max(p2.numero_periodo) FROM periodo_facturacion_postventa p2 WHERE p2.id_lead = l.id)
JOIN lead_etapa_resumen r ON r.id_lead = l.id AND r.etapa = 'POSTVENTA'
WHERE l.id = (SELECT id_lead FROM _revert_baja_lead);

SELECT count(*) AS eventos_baja_restantes
FROM evento e
WHERE e.id_lead = (SELECT id_lead FROM _revert_baja_lead)
  AND e.accion = 'TIPIFICACION'
  AND e.tipificacion = 'BAJA'
  AND e.subtipificacion = 'FINALIZADA';

COMMIT;
