-- ==========================================================================
-- V72: Crear lead_seguimiento y poblar con datos históricos de Evento
--
-- Principio: fechas manuales (programacion, rechazo, instalacion) siempre
-- ganan sobre automáticas (created_at). Paso final de coherencia garantiza
-- que ninguna fecha automática caiga en día posterior a una manual.
-- ==========================================================================

-- ========================
-- PASO 1: Crear tabla
-- ========================

CREATE TABLE lead_seguimiento (
    id              BIGSERIAL PRIMARY KEY,
    id_lead         BIGINT NOT NULL UNIQUE REFERENCES lead(id),

    -- PREVENTA
    fecha_agendamiento_preventa TIMESTAMPTZ,

    -- VENTA
    fecha_ingreso_venta   TIMESTAMPTZ,
    fecha_grabacion       TIMESTAMPTZ,
    fecha_programacion    TIMESTAMPTZ,
    fecha_rechazo         DATE,
    fecha_instalacion     DATE,

    -- POSTVENTA
    fecha_ingreso_postventa TIMESTAMPTZ,
    fecha_suspension        DATE,
    fecha_baja              DATE,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lead_seguimiento_lead ON lead_seguimiento(id_lead);

-- ========================
-- PASO 2: Insertar todos los leads (filas esqueleto)
-- ========================

INSERT INTO lead_seguimiento (id_lead)
SELECT id FROM lead;

-- ========================
-- PASO 3: fecha_instalacion (terminal, sin fallback)
-- Fuente: último evento en VENTA con fecha_instalacion NOT NULL
-- ========================

UPDATE lead_seguimiento seg
SET fecha_instalacion = sub.fecha
FROM (
    SELECT DISTINCT ON (e.id_lead)
           e.id_lead,
           e.fecha_instalacion AS fecha
    FROM evento e
    WHERE e.etapa = 'VENTA'
      AND e.accion = 'TIPIFICACION'
      AND e.fecha_instalacion IS NOT NULL
    ORDER BY e.id_lead, e.id DESC
) sub
WHERE sub.id_lead = seg.id_lead;

-- ========================
-- PASO 4: fecha_rechazo (terminal, sin fallback)
-- Fuente: último evento en VENTA con fecha_rechazo NOT NULL
-- ========================

UPDATE lead_seguimiento seg
SET fecha_rechazo = sub.fecha
FROM (
    SELECT DISTINCT ON (e.id_lead)
           e.id_lead,
           e.fecha_rechazo AS fecha
    FROM evento e
    WHERE e.etapa = 'VENTA'
      AND e.accion = 'TIPIFICACION'
      AND e.fecha_rechazo IS NOT NULL
    ORDER BY e.id_lead, e.id DESC
) sub
WHERE sub.id_lead = seg.id_lead;

-- ========================
-- PASO 5: fecha_programacion (fusión fecha + hora → TIMESTAMPTZ)
-- Fuente: último evento en VENTA con fecha_programacion NOT NULL
-- hora_programada es TIME (no rango); si es NULL, se usa medianoche
-- El servidor es UTC; las fechas ingresadas son hora Lima
-- ========================

UPDATE lead_seguimiento seg
SET fecha_programacion = sub.fecha
FROM (
    SELECT DISTINCT ON (e.id_lead)
           e.id_lead,
           (e.fecha_programacion + COALESCE(e.hora_programada, '00:00:00'::time))
               AT TIME ZONE 'America/Lima' AS fecha
    FROM evento e
    WHERE e.etapa = 'VENTA'
      AND e.accion = 'TIPIFICACION'
      AND e.fecha_programacion IS NOT NULL
    ORDER BY e.id_lead, e.id DESC
) sub
WHERE sub.id_lead = seg.id_lead;

-- ========================
-- PASO 6: fecha_grabacion (por proveedor, hardcodeado para datos históricos)
-- WIN: tipi = 'GRABADO'
-- CLARO: subtipi = 'CON SEC - GRABADO'
-- MIFIBRA/PERUFIBRA: subtipi = 'GRABADO' bajo tipi 'SIN INGRESAR'
-- ========================

WITH grabacion_eventos AS (
    SELECT e.id_lead, e.created_at
    FROM evento e
    JOIN lead l ON l.id = e.id_lead
    JOIN proveedor p ON p.id = l.id_proveedor
    WHERE e.etapa = 'VENTA' AND e.accion = 'TIPIFICACION'
      AND p.nombre = 'WIN' AND e.tipificacion = 'GRABADO'
    UNION ALL
    SELECT e.id_lead, e.created_at
    FROM evento e
    JOIN lead l ON l.id = e.id_lead
    JOIN proveedor p ON p.id = l.id_proveedor
    WHERE e.etapa = 'VENTA' AND e.accion = 'TIPIFICACION'
      AND p.nombre = 'CLARO' AND e.subtipificacion = 'CON SEC - GRABADO'
    UNION ALL
    SELECT e.id_lead, e.created_at
    FROM evento e
    JOIN lead l ON l.id = e.id_lead
    JOIN proveedor p ON p.id = l.id_proveedor
    WHERE e.etapa = 'VENTA' AND e.accion = 'TIPIFICACION'
      AND p.nombre IN ('MIFIBRA', 'PERUFIBRA')
      AND e.tipificacion = 'SIN INGRESAR' AND e.subtipificacion = 'GRABADO'
),
grabacion_ultimo AS (
    SELECT DISTINCT ON (id_lead) id_lead, created_at AS fecha
    FROM grabacion_eventos
    ORDER BY id_lead, created_at DESC
)
UPDATE lead_seguimiento seg
SET fecha_grabacion = g.fecha
FROM grabacion_ultimo g
WHERE g.id_lead = seg.id_lead;

-- ========================
-- PASO 7: fecha_ingreso_venta (cadena de fallback)
--
-- Fallback 1: created_at del ÚLTIMO evento con tipi = 'INGRESADO' en VENTA
-- Fallback 2: MIN(fechas manuales) del lead en VENTA
-- Fallback 3: created_at del PRIMER evento con cualquier tipi en VENTA
-- Fallback 4: fecha_ingreso_etapa del resumen VENTA
-- ========================

-- 7a: Fallback 1 — evento INGRESADO
UPDATE lead_seguimiento seg
SET fecha_ingreso_venta = sub.fecha
FROM (
    SELECT DISTINCT ON (e.id_lead)
           e.id_lead,
           e.created_at AS fecha
    FROM evento e
    WHERE e.etapa = 'VENTA'
      AND e.accion = 'TIPIFICACION'
      AND e.tipificacion = 'INGRESADO'
    ORDER BY e.id_lead, e.id DESC
) sub
WHERE sub.id_lead = seg.id_lead;

-- 7b: Fallback 2 — MIN(fechas manuales) para leads SIN fecha_ingreso_venta
-- Solo aplica a leads que tienen resumen VENTA (pasaron por VENTA)
UPDATE lead_seguimiento seg
SET fecha_ingreso_venta = sub.fecha_min
FROM (
    SELECT e.id_lead,
           MIN(LEAST(
               COALESCE(e.fecha_programacion::timestamptz, 'infinity'::timestamptz),
               COALESCE(e.fecha_rechazo::timestamptz,      'infinity'::timestamptz),
               COALESCE(e.fecha_instalacion::timestamptz,   'infinity'::timestamptz)
           )) AS fecha_min
    FROM evento e
    WHERE e.etapa = 'VENTA'
      AND e.accion = 'TIPIFICACION'
      AND (e.fecha_programacion IS NOT NULL
        OR e.fecha_rechazo IS NOT NULL
        OR e.fecha_instalacion IS NOT NULL)
    GROUP BY e.id_lead
    HAVING MIN(LEAST(
               COALESCE(e.fecha_programacion::timestamptz, 'infinity'::timestamptz),
               COALESCE(e.fecha_rechazo::timestamptz,      'infinity'::timestamptz),
               COALESCE(e.fecha_instalacion::timestamptz,   'infinity'::timestamptz)
           )) < 'infinity'::timestamptz
) sub
WHERE sub.id_lead = seg.id_lead
  AND seg.fecha_ingreso_venta IS NULL
  AND EXISTS (SELECT 1 FROM lead_etapa_resumen r WHERE r.id_lead = seg.id_lead AND r.etapa = 'VENTA');

-- 7c: Fallback 3 — created_at del PRIMER evento de tipi en VENTA
UPDATE lead_seguimiento seg
SET fecha_ingreso_venta = sub.fecha
FROM (
    SELECT DISTINCT ON (e.id_lead)
           e.id_lead,
           e.created_at AS fecha
    FROM evento e
    WHERE e.etapa = 'VENTA'
      AND e.accion = 'TIPIFICACION'
    ORDER BY e.id_lead, e.id ASC
) sub
WHERE sub.id_lead = seg.id_lead
  AND seg.fecha_ingreso_venta IS NULL
  AND EXISTS (SELECT 1 FROM lead_etapa_resumen r WHERE r.id_lead = seg.id_lead AND r.etapa = 'VENTA');

-- 7d: Fallback 4 — fecha_ingreso_etapa del resumen VENTA (167 leads sin eventos)
UPDATE lead_seguimiento seg
SET fecha_ingreso_venta = r.fecha_ingreso_etapa
FROM lead_etapa_resumen r
WHERE r.id_lead = seg.id_lead
  AND r.etapa = 'VENTA'
  AND seg.fecha_ingreso_venta IS NULL;

-- ========================
-- PASO 8: fecha_agendamiento_preventa
-- Fuente: created_at del ÚLTIMO evento con subtipi que tiene APARECE_EN_AGENDADOS_GTR
-- ========================

UPDATE lead_seguimiento seg
SET fecha_agendamiento_preventa = sub.fecha
FROM (
    SELECT DISTINCT ON (e.id_lead)
           e.id_lead,
           e.created_at AS fecha
    FROM evento e
    JOIN subtipificacion s ON s.codigo = e.subtipificacion
    JOIN tipificacion t ON t.id = s.tipificacion_id AND t.codigo = e.tipificacion
    JOIN matriz_tipificacion m ON m.id = t.matriz_id AND m.etapa = 'PREVENTA'
    JOIN lead l ON l.id = e.id_lead AND l.id_proveedor = m.id_proveedor
    JOIN subtipificacion_comportamiento sc ON sc.subtipificacion_id = s.id
    WHERE e.etapa = 'PREVENTA'
      AND e.accion = 'TIPIFICACION'
      AND sc.comportamiento = 'APARECE_EN_AGENDADOS_GTR'
    ORDER BY e.id_lead, e.id DESC
) sub
WHERE sub.id_lead = seg.id_lead;

-- ========================
-- PASO 9: fecha_ingreso_postventa
-- Fuente: fecha_ingreso_etapa del resumen POSTVENTA
-- ========================

UPDATE lead_seguimiento seg
SET fecha_ingreso_postventa = r.fecha_ingreso_etapa
FROM lead_etapa_resumen r
WHERE r.id_lead = seg.id_lead
  AND r.etapa = 'POSTVENTA'
  AND r.fecha_ingreso_etapa IS NOT NULL;

-- ========================
-- PASO 10: Coherencia temporal
--
-- Regla: fechas AUTOMÁTICAS (ingreso_venta, grabacion) no pueden caer en un DÍA
-- posterior a fechas MANUALES (programacion, rechazo, instalacion).
-- Entre dos automáticas (ingreso vs grabacion) no se capea — el orden histórico
-- real puede variar (GRABADO ≤ INGRESADO es la escalera, pero no siempre se respetó).
-- Entre dos manuales (programacion vs instalacion) tampoco — ambas son verdad del negocio.
-- Comparaciones a nivel de DATE para evitar artefactos de timezone (UTC vs Lima).
-- ========================

-- 10a: fecha_ingreso_venta (AUTO) no puede caer después de fechas manuales
UPDATE lead_seguimiento SET
    fecha_ingreso_venta = LEAST(
        fecha_ingreso_venta,
        COALESCE(fecha_programacion,                                         fecha_ingreso_venta),
        COALESCE((fecha_rechazo     + TIME '00:00') AT TIME ZONE 'America/Lima', fecha_ingreso_venta),
        COALESCE((fecha_instalacion + TIME '00:00') AT TIME ZONE 'America/Lima', fecha_ingreso_venta)
    )
WHERE fecha_ingreso_venta IS NOT NULL
  AND (
      (fecha_programacion IS NOT NULL AND fecha_ingreso_venta::date > fecha_programacion::date)
   OR (fecha_rechazo      IS NOT NULL AND fecha_ingreso_venta::date > fecha_rechazo)
   OR (fecha_instalacion  IS NOT NULL AND fecha_ingreso_venta::date > fecha_instalacion)
  );

-- 10b: fecha_grabacion (AUTO) no puede caer después de fechas manuales
UPDATE lead_seguimiento SET
    fecha_grabacion = LEAST(
        fecha_grabacion,
        COALESCE(fecha_programacion,                                         fecha_grabacion),
        COALESCE((fecha_rechazo     + TIME '00:00') AT TIME ZONE 'America/Lima', fecha_grabacion),
        COALESCE((fecha_instalacion + TIME '00:00') AT TIME ZONE 'America/Lima', fecha_grabacion)
    )
WHERE fecha_grabacion IS NOT NULL
  AND (
      (fecha_programacion IS NOT NULL AND fecha_grabacion::date > fecha_programacion::date)
   OR (fecha_rechazo      IS NOT NULL AND fecha_grabacion::date > fecha_rechazo)
   OR (fecha_instalacion  IS NOT NULL AND fecha_grabacion::date > fecha_instalacion)
  );

-- ========================
-- PASO 11: Verificación — DEBE dar 0 filas
-- Solo valida AUTO vs MANUAL (no auto-vs-auto ni manual-vs-manual)
-- Si falla, la migración aborta y Flyway hace rollback
-- ========================

DO $$
DECLARE
    violaciones INT;
BEGIN
    -- AUTO vs MANUAL: ingreso/grabacion no pueden caer en día posterior a programacion/rechazo/instalacion
    SELECT COUNT(*) INTO violaciones
    FROM lead_seguimiento
    WHERE (fecha_ingreso_venta IS NOT NULL AND fecha_programacion IS NOT NULL AND fecha_ingreso_venta::date > fecha_programacion::date)
       OR (fecha_ingreso_venta IS NOT NULL AND fecha_rechazo      IS NOT NULL AND fecha_ingreso_venta::date > fecha_rechazo)
       OR (fecha_ingreso_venta IS NOT NULL AND fecha_instalacion  IS NOT NULL AND fecha_ingreso_venta::date > fecha_instalacion)
       OR (fecha_grabacion     IS NOT NULL AND fecha_programacion IS NOT NULL AND fecha_grabacion::date     > fecha_programacion::date)
       OR (fecha_grabacion     IS NOT NULL AND fecha_rechazo      IS NOT NULL AND fecha_grabacion::date     > fecha_rechazo)
       OR (fecha_grabacion     IS NOT NULL AND fecha_instalacion  IS NOT NULL AND fecha_grabacion::date     > fecha_instalacion);

    IF violaciones > 0 THEN
        RAISE EXCEPTION 'COHERENCIA TEMPORAL ROTA: % leads con fecha automática posterior a manual', violaciones;
    END IF;

    -- Cobertura: todos los leads con resumen VENTA deben tener fecha_ingreso_venta
    SELECT COUNT(*) INTO violaciones
    FROM lead_etapa_resumen r
    WHERE r.etapa = 'VENTA'
      AND NOT EXISTS (
          SELECT 1 FROM lead_seguimiento seg
          WHERE seg.id_lead = r.id_lead AND seg.fecha_ingreso_venta IS NOT NULL
      );

    IF violaciones > 0 THEN
        RAISE EXCEPTION 'COBERTURA INCOMPLETA: % leads con resumen VENTA sin fecha_ingreso_venta', violaciones;
    END IF;
END $$;
