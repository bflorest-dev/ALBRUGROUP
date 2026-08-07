-- Recalculo manual de asistencia para agosto 2026.
--
-- Objetivo:
-- 1. Mantener las marcas reales de ingreso.
-- 2. Usar el horario vigente actual de cada empleado como horario programado retroactivo de agosto.
-- 3. Recalcular minutos_trabajados y minutos_balance con la politica operativa del balance:
--    - entrada temprana se topa en entrada programada
--    - salida tardia se topa en salida programada
--    - segundos/microsegundos se redondean a favor del empleado
--    - objetivo diario = duracion entrada-salida programada usada historicamente en asistencia
--
-- IMPORTANTE:
-- Si el horario anterior corto la jornada antes de tiempo, fecha_hora_salida puede haber quedado
-- guardada como la salida programada vieja. En ese caso la salida real posterior ya no existe en
-- asistencia. El flag assume_old_cutoff_to_current permite corregir esos casos al nuevo corte.
-- Por defecto esa correccion de salida cortada solo aplica hasta cutoff_fix_hasta, porque el problema
-- operativo fue detectado/corregido el 03/08.
--
-- Uso recomendado en produccion:
--   psql -U postgres -d schedule_db -f recalcular_asistencia_agosto_2026.sql
--
-- Ejecuta primero con do_update=false y revisa los previews.
-- Luego cambia do_update=true. Si aceptas corregir salidas cortadas por horario viejo, cambia tambien
-- assume_old_cutoff_to_current=true.

\if :{?desde}
\else
    \set desde '2026-08-01'
\endif
\if :{?hasta}
\else
    \set hasta '2026-08-31'
\endif
\if :{?minutos_redondeo_favor_empleado}
\else
    \set minutos_redondeo_favor_empleado 0
\endif
\if :{?assume_old_cutoff_to_current}
\else
    \set assume_old_cutoff_to_current false
\endif
\if :{?cutoff_fix_hasta}
\else
    \set cutoff_fix_hasta '2026-08-03'
\endif
\if :{?do_update}
\else
    \set do_update false
\endif

BEGIN;

WITH
params AS (
    SELECT
        :'desde'::date AS desde,
        :'hasta'::date AS hasta,
        :'cutoff_fix_hasta'::date AS cutoff_fix_hasta,
        :minutos_redondeo_favor_empleado::int AS grace_min,
        :assume_old_cutoff_to_current::boolean AS assume_old_cutoff_to_current
),
current_horario AS (
    SELECT DISTINCT ON (h.id_empleado)
        h.id_empleado,
        h.id AS id_horario_actual
    FROM horario h
    WHERE h.fecha_fin IS NULL
    ORDER BY h.id_empleado, h.fecha_inicio DESC, h.id DESC
),
base AS (
    SELECT
        a.*,
        ch.id_horario_actual,
        hd.laborable AS laborable_actual,
        hd.hora_entrada AS entrada_actual,
        hd.hora_salida AS salida_actual,
        hd.inicio_almuerzo AS inicio_almuerzo_actual,
        hd.fin_almuerzo AS fin_almuerzo_actual,
        CASE EXTRACT(ISODOW FROM a.fecha)::int
            WHEN 1 THEN 'LUNES'
            WHEN 2 THEN 'MARTES'
            WHEN 3 THEN 'MIERCOLES'
            WHEN 4 THEN 'JUEVES'
            WHEN 5 THEN 'VIERNES'
            WHEN 6 THEN 'SABADO'
            ELSE 'DOMINGO'
        END AS dia_asistencia
    FROM asistencia a
    JOIN params p ON a.fecha BETWEEN p.desde AND p.hasta
    JOIN current_horario ch ON ch.id_empleado = a.id_empleado
    JOIN horario_detalle hd ON hd.horario_id = ch.id_horario_actual
        AND hd.dia = CASE EXTRACT(ISODOW FROM a.fecha)::int
            WHEN 1 THEN 'LUNES'
            WHEN 2 THEN 'MARTES'
            WHEN 3 THEN 'MIERCOLES'
            WHEN 4 THEN 'JUEVES'
            WHEN 5 THEN 'VIERNES'
            WHEN 6 THEN 'SABADO'
            ELSE 'DOMINGO'
        END
    WHERE a.fecha_hora_ingreso IS NOT NULL
      AND a.fecha_hora_salida IS NOT NULL
      AND NOT EXISTS (
          SELECT 1
          FROM asistencia_tramo t
          WHERE t.asistencia_id = a.id
      )
),
times AS (
    SELECT
        b.*,
        (b.fecha + b.entrada_actual) AS entrada_actual_at,
        (b.fecha + b.salida_actual
            + CASE WHEN b.salida_actual <= b.entrada_actual THEN interval '1 day' ELSE interval '0' END) AS salida_actual_at,
        (b.fecha + b.entrada_programada) AS entrada_anterior_at,
        (b.fecha + b.salida_programada
            + CASE WHEN b.salida_programada <= b.entrada_programada THEN interval '1 day' ELSE interval '0' END) AS salida_anterior_at
    FROM base b
    WHERE b.laborable_actual IS TRUE
),
calc AS (
    SELECT
        t.*,
        GREATEST(t.fecha_hora_ingreso, t.entrada_actual_at) AS ingreso_computable_at,
        CASE
            WHEN p.assume_old_cutoff_to_current
             AND t.fecha <= p.cutoff_fix_hasta
             AND t.fecha_hora_salida = t.salida_anterior_at
             AND t.salida_anterior_at < t.salida_actual_at
            THEN t.salida_actual_at
            ELSE LEAST(t.fecha_hora_salida, t.salida_actual_at)
        END AS salida_computable_at,
        GREATEST((EXTRACT(EPOCH FROM (t.salida_actual_at - t.entrada_actual_at)) / 60)::int, 0) AS nuevo_objetivo
    FROM times t
    CROSS JOIN params p
),
rounded AS (
    SELECT
        c.*,
        date_trunc('minute', c.ingreso_computable_at - make_interval(mins => p.grace_min)) AS ingreso_redondeado_at,
        CASE
            WHEN (c.salida_computable_at + make_interval(mins => p.grace_min))
                 = date_trunc('minute', c.salida_computable_at + make_interval(mins => p.grace_min))
            THEN date_trunc('minute', c.salida_computable_at + make_interval(mins => p.grace_min))
            ELSE date_trunc('minute', c.salida_computable_at + make_interval(mins => p.grace_min)) + interval '1 minute'
        END AS salida_redondeada_at
    FROM calc c
    CROSS JOIN params p
),
final_calc AS (
    SELECT
        r.id,
        r.id_empleado,
        r.fecha,
        r.id_horario AS id_horario_anterior,
        r.id_horario_actual AS nuevo_id_horario,
        r.entrada_programada AS entrada_anterior,
        r.salida_programada AS salida_anterior,
        r.entrada_actual AS nueva_entrada,
        r.salida_actual AS nueva_salida,
        r.fecha_hora_ingreso,
        r.fecha_hora_salida,
        r.salida_computable_at AS nueva_fecha_hora_salida,
        r.minutos_objetivo_dia AS objetivo_anterior,
        r.nuevo_objetivo,
        r.minutos_trabajados AS trabajados_anterior,
        GREATEST(
            (EXTRACT(EPOCH FROM (r.salida_redondeada_at - r.ingreso_redondeado_at)) / 60)::int
            - COALESCE(r.minutos_almuerzo_tomados, 0)
            - COALESCE(r.minutos_servicios_acumulados, 0),
            0
        ) AS nuevos_trabajados,
        r.minutos_balance AS balance_anterior,
        GREATEST(
            (EXTRACT(EPOCH FROM (r.salida_redondeada_at - r.ingreso_redondeado_at)) / 60)::int
            - COALESCE(r.minutos_almuerzo_tomados, 0)
            - COALESCE(r.minutos_servicios_acumulados, 0),
            0
        ) - r.nuevo_objetivo AS nuevo_balance,
        r.inicio_almuerzo_actual,
        r.fin_almuerzo_actual
    FROM rounded r
)
SELECT
    count(*) AS filas_evaluadas,
    count(*) FILTER (
        WHERE id_horario_anterior IS DISTINCT FROM nuevo_id_horario
           OR entrada_anterior IS DISTINCT FROM nueva_entrada
           OR salida_anterior IS DISTINCT FROM nueva_salida
           OR objetivo_anterior IS DISTINCT FROM nuevo_objetivo
           OR trabajados_anterior IS DISTINCT FROM nuevos_trabajados
           OR balance_anterior IS DISTINCT FROM nuevo_balance
    ) AS filas_con_cambio,
    sum(balance_anterior) AS balance_total_anterior,
    sum(nuevo_balance) AS balance_total_nuevo,
    sum(nuevo_balance - balance_anterior) AS diferencia_balance
FROM final_calc;

WITH
params AS (
    SELECT :'desde'::date AS desde, :'hasta'::date AS hasta, :'cutoff_fix_hasta'::date AS cutoff_fix_hasta,
           :minutos_redondeo_favor_empleado::int AS grace_min,
           :assume_old_cutoff_to_current::boolean AS assume_old_cutoff_to_current
),
current_horario AS (
    SELECT DISTINCT ON (h.id_empleado) h.id_empleado, h.id AS id_horario_actual
    FROM horario h
    WHERE h.fecha_fin IS NULL
    ORDER BY h.id_empleado, h.fecha_inicio DESC, h.id DESC
),
base AS (
    SELECT a.*, ch.id_horario_actual, hd.laborable AS laborable_actual, hd.hora_entrada AS entrada_actual,
           hd.hora_salida AS salida_actual, hd.inicio_almuerzo AS inicio_almuerzo_actual, hd.fin_almuerzo AS fin_almuerzo_actual
    FROM asistencia a
    JOIN params p ON a.fecha BETWEEN p.desde AND p.hasta
    JOIN current_horario ch ON ch.id_empleado = a.id_empleado
    JOIN horario_detalle hd ON hd.horario_id = ch.id_horario_actual
        AND hd.dia = CASE EXTRACT(ISODOW FROM a.fecha)::int
            WHEN 1 THEN 'LUNES' WHEN 2 THEN 'MARTES' WHEN 3 THEN 'MIERCOLES'
            WHEN 4 THEN 'JUEVES' WHEN 5 THEN 'VIERNES' WHEN 6 THEN 'SABADO' ELSE 'DOMINGO' END
    WHERE a.fecha_hora_ingreso IS NOT NULL
      AND a.fecha_hora_salida IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM asistencia_tramo t WHERE t.asistencia_id = a.id)
),
times AS (
    SELECT b.*,
           (b.fecha + b.entrada_actual) AS entrada_actual_at,
           (b.fecha + b.salida_actual + CASE WHEN b.salida_actual <= b.entrada_actual THEN interval '1 day' ELSE interval '0' END) AS salida_actual_at,
           (b.fecha + b.salida_programada + CASE WHEN b.salida_programada <= b.entrada_programada THEN interval '1 day' ELSE interval '0' END) AS salida_anterior_at
    FROM base b
    WHERE b.laborable_actual IS TRUE
),
calc AS (
    SELECT t.*,
           GREATEST(t.fecha_hora_ingreso, t.entrada_actual_at) AS ingreso_computable_at,
           CASE WHEN p.assume_old_cutoff_to_current
                 AND t.fecha <= p.cutoff_fix_hasta
                 AND t.fecha_hora_salida = t.salida_anterior_at
                 AND t.salida_anterior_at < t.salida_actual_at
                THEN t.salida_actual_at
                ELSE LEAST(t.fecha_hora_salida, t.salida_actual_at)
           END AS salida_computable_at,
           GREATEST((EXTRACT(EPOCH FROM (t.salida_actual_at - t.entrada_actual_at)) / 60)::int, 0) AS nuevo_objetivo
    FROM times t CROSS JOIN params p
),
rounded AS (
    SELECT c.*,
           date_trunc('minute', c.ingreso_computable_at - make_interval(mins => p.grace_min)) AS ingreso_redondeado_at,
           CASE WHEN (c.salida_computable_at + make_interval(mins => p.grace_min))
                     = date_trunc('minute', c.salida_computable_at + make_interval(mins => p.grace_min))
                THEN date_trunc('minute', c.salida_computable_at + make_interval(mins => p.grace_min))
                ELSE date_trunc('minute', c.salida_computable_at + make_interval(mins => p.grace_min)) + interval '1 minute'
           END AS salida_redondeada_at
    FROM calc c CROSS JOIN params p
),
final_calc AS (
    SELECT r.id, r.id_empleado, r.fecha, r.id_horario AS id_horario_anterior, r.id_horario_actual AS nuevo_id_horario,
           r.entrada_programada AS entrada_anterior, r.salida_programada AS salida_anterior,
           r.entrada_actual AS nueva_entrada, r.salida_actual AS nueva_salida,
           r.fecha_hora_ingreso, r.fecha_hora_salida, r.salida_computable_at AS nueva_fecha_hora_salida,
           r.minutos_objetivo_dia AS objetivo_anterior, r.nuevo_objetivo,
           r.minutos_trabajados AS trabajados_anterior,
           GREATEST((EXTRACT(EPOCH FROM (r.salida_redondeada_at - r.ingreso_redondeado_at)) / 60)::int
                    - COALESCE(r.minutos_almuerzo_tomados, 0)
                    - COALESCE(r.minutos_servicios_acumulados, 0), 0) AS nuevos_trabajados,
           r.minutos_balance AS balance_anterior,
           GREATEST((EXTRACT(EPOCH FROM (r.salida_redondeada_at - r.ingreso_redondeado_at)) / 60)::int
                    - COALESCE(r.minutos_almuerzo_tomados, 0)
                    - COALESCE(r.minutos_servicios_acumulados, 0), 0) - r.nuevo_objetivo AS nuevo_balance,
           r.inicio_almuerzo_actual, r.fin_almuerzo_actual
    FROM rounded r
)
SELECT
    id_empleado,
    fecha,
    id_horario_anterior,
    nuevo_id_horario,
    entrada_anterior,
    salida_anterior,
    nueva_entrada,
    nueva_salida,
    fecha_hora_ingreso,
    fecha_hora_salida,
    nueva_fecha_hora_salida,
    objetivo_anterior,
    nuevo_objetivo,
    trabajados_anterior,
    nuevos_trabajados,
    balance_anterior,
    nuevo_balance,
    nuevo_balance - balance_anterior AS diferencia_balance
FROM final_calc
WHERE id_horario_anterior IS DISTINCT FROM nuevo_id_horario
   OR entrada_anterior IS DISTINCT FROM nueva_entrada
   OR salida_anterior IS DISTINCT FROM nueva_salida
   OR objetivo_anterior IS DISTINCT FROM nuevo_objetivo
   OR trabajados_anterior IS DISTINCT FROM nuevos_trabajados
   OR balance_anterior IS DISTINCT FROM nuevo_balance
ORDER BY id_empleado, fecha
LIMIT 200;

WITH should_update AS (
    SELECT :do_update::boolean AS value
),
params AS (
    SELECT :'desde'::date AS desde, :'hasta'::date AS hasta, :'cutoff_fix_hasta'::date AS cutoff_fix_hasta,
           :minutos_redondeo_favor_empleado::int AS grace_min,
           :assume_old_cutoff_to_current::boolean AS assume_old_cutoff_to_current
),
current_horario AS (
    SELECT DISTINCT ON (h.id_empleado) h.id_empleado, h.id AS id_horario_actual
    FROM horario h
    WHERE h.fecha_fin IS NULL
    ORDER BY h.id_empleado, h.fecha_inicio DESC, h.id DESC
),
base AS (
    SELECT a.*, ch.id_horario_actual, hd.laborable AS laborable_actual, hd.hora_entrada AS entrada_actual,
           hd.hora_salida AS salida_actual, hd.inicio_almuerzo AS inicio_almuerzo_actual, hd.fin_almuerzo AS fin_almuerzo_actual
    FROM asistencia a
    JOIN params p ON a.fecha BETWEEN p.desde AND p.hasta
    JOIN current_horario ch ON ch.id_empleado = a.id_empleado
    JOIN horario_detalle hd ON hd.horario_id = ch.id_horario_actual
        AND hd.dia = CASE EXTRACT(ISODOW FROM a.fecha)::int
            WHEN 1 THEN 'LUNES' WHEN 2 THEN 'MARTES' WHEN 3 THEN 'MIERCOLES'
            WHEN 4 THEN 'JUEVES' WHEN 5 THEN 'VIERNES' WHEN 6 THEN 'SABADO' ELSE 'DOMINGO' END
    WHERE a.fecha_hora_ingreso IS NOT NULL
      AND a.fecha_hora_salida IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM asistencia_tramo t WHERE t.asistencia_id = a.id)
),
times AS (
    SELECT b.*,
           (b.fecha + b.entrada_actual) AS entrada_actual_at,
           (b.fecha + b.salida_actual + CASE WHEN b.salida_actual <= b.entrada_actual THEN interval '1 day' ELSE interval '0' END) AS salida_actual_at,
           (b.fecha + b.salida_programada + CASE WHEN b.salida_programada <= b.entrada_programada THEN interval '1 day' ELSE interval '0' END) AS salida_anterior_at
    FROM base b
    WHERE b.laborable_actual IS TRUE
),
calc AS (
    SELECT t.*,
           GREATEST(t.fecha_hora_ingreso, t.entrada_actual_at) AS ingreso_computable_at,
           CASE WHEN p.assume_old_cutoff_to_current
                 AND t.fecha <= p.cutoff_fix_hasta
                 AND t.fecha_hora_salida = t.salida_anterior_at
                 AND t.salida_anterior_at < t.salida_actual_at
                THEN t.salida_actual_at
                ELSE LEAST(t.fecha_hora_salida, t.salida_actual_at)
           END AS salida_computable_at,
           GREATEST((EXTRACT(EPOCH FROM (t.salida_actual_at - t.entrada_actual_at)) / 60)::int, 0) AS nuevo_objetivo
    FROM times t CROSS JOIN params p
),
rounded AS (
    SELECT c.*,
           date_trunc('minute', c.ingreso_computable_at - make_interval(mins => p.grace_min)) AS ingreso_redondeado_at,
           CASE WHEN (c.salida_computable_at + make_interval(mins => p.grace_min))
                     = date_trunc('minute', c.salida_computable_at + make_interval(mins => p.grace_min))
                THEN date_trunc('minute', c.salida_computable_at + make_interval(mins => p.grace_min))
                ELSE date_trunc('minute', c.salida_computable_at + make_interval(mins => p.grace_min)) + interval '1 minute'
           END AS salida_redondeada_at
    FROM calc c CROSS JOIN params p
),
final_calc AS (
    SELECT r.id, r.id_horario_actual AS nuevo_id_horario,
           r.entrada_actual AS nueva_entrada, r.salida_actual AS nueva_salida,
           r.inicio_almuerzo_actual, r.fin_almuerzo_actual, r.salida_computable_at AS nueva_fecha_hora_salida,
           r.nuevo_objetivo,
           GREATEST((EXTRACT(EPOCH FROM (r.salida_redondeada_at - r.ingreso_redondeado_at)) / 60)::int
                    - COALESCE(r.minutos_almuerzo_tomados, 0)
                    - COALESCE(r.minutos_servicios_acumulados, 0), 0) AS nuevos_trabajados
    FROM rounded r
),
updated AS (
    UPDATE asistencia a
    SET
        id_horario = f.nuevo_id_horario,
        entrada_programada = f.nueva_entrada,
        salida_programada = f.nueva_salida,
        inicio_almuerzo_programado = f.inicio_almuerzo_actual,
        fin_almuerzo_programado = f.fin_almuerzo_actual,
        fecha_hora_salida = f.nueva_fecha_hora_salida,
        minutos_objetivo_dia = f.nuevo_objetivo,
        minutos_trabajados = f.nuevos_trabajados,
        minutos_balance = f.nuevos_trabajados - f.nuevo_objetivo,
        updated_at = now()
    FROM final_calc f, should_update su
    WHERE su.value
      AND a.id = f.id
    RETURNING a.id
)
SELECT
    CASE WHEN :do_update::boolean THEN 'UPDATE_APLICADO' ELSE 'DRY_RUN_SIN_UPDATE' END AS modo,
    count(*) AS filas_actualizadas
FROM updated;

-- Seguridad: si do_update=false, este COMMIT no cambia datos.
-- Si do_update=true, revisa el output antes de ejecutar en produccion.
COMMIT;
