-- Correccion puntual de jornadas historicas abiertas.
-- Alcance exclusivo: fecha < 2026-11-01, con ingreso y sin salida.
-- No crea asistencias ni modifica horarios, tramos archivados, sesiones,
-- minutos derivados ni resumen_asistencia_mensual.

BEGIN;

CREATE TEMP TABLE _historical_auto_close ON COMMIT DROP AS
WITH base AS (
    SELECT
        a.id,
        a.id_empleado,
        a.fecha,
        a.fecha_hora_ingreso,
        a.entrada_programada,
        a.salida_programada,
        (SELECT count(*)
         FROM horario h
         WHERE h.id = a.id_horario
           AND h.id_empleado = a.id_empleado
           AND a.fecha >= h.fecha_inicio
           AND (h.fecha_fin IS NULL OR a.fecha <= h.fecha_fin)) AS horario_count,
        (SELECT count(*)
         FROM horario_detalle hd
         WHERE hd.horario_id = a.id_horario
           AND hd.dia = CASE EXTRACT(ISODOW FROM a.fecha)::int
               WHEN 1 THEN 'LUNES'
               WHEN 2 THEN 'MARTES'
               WHEN 3 THEN 'MIERCOLES'
               WHEN 4 THEN 'JUEVES'
               WHEN 5 THEN 'VIERNES'
               WHEN 6 THEN 'SABADO'
               ELSE 'DOMINGO'
           END) AS detalle_count,
        (SELECT max(hd.hora_entrada)
         FROM horario_detalle hd
         WHERE hd.horario_id = a.id_horario
           AND hd.dia = CASE EXTRACT(ISODOW FROM a.fecha)::int
               WHEN 1 THEN 'LUNES'
               WHEN 2 THEN 'MARTES'
               WHEN 3 THEN 'MIERCOLES'
               WHEN 4 THEN 'JUEVES'
               WHEN 5 THEN 'VIERNES'
               WHEN 6 THEN 'SABADO'
               ELSE 'DOMINGO'
           END) AS detalle_entrada,
        (SELECT max(hd.hora_salida)
         FROM horario_detalle hd
         WHERE hd.horario_id = a.id_horario
           AND hd.dia = CASE EXTRACT(ISODOW FROM a.fecha)::int
               WHEN 1 THEN 'LUNES'
               WHEN 2 THEN 'MARTES'
               WHEN 3 THEN 'MIERCOLES'
               WHEN 4 THEN 'JUEVES'
               WHEN 5 THEN 'VIERNES'
               WHEN 6 THEN 'SABADO'
               ELSE 'DOMINGO'
           END) AS detalle_salida,
        (SELECT count(*)
         FROM excepcion_horario ex
         WHERE ex.horario_id = a.id_horario
           AND ex.fecha = a.fecha) AS excepcion_count,
        (SELECT bool_and(ex.laborable)
         FROM excepcion_horario ex
         WHERE ex.horario_id = a.id_horario
           AND ex.fecha = a.fecha) AS excepcion_laborable,
        (SELECT max(ex.hora_entrada)
         FROM excepcion_horario ex
         WHERE ex.horario_id = a.id_horario
           AND ex.fecha = a.fecha) AS excepcion_entrada,
        (SELECT max(ex.hora_salida)
         FROM excepcion_horario ex
         WHERE ex.horario_id = a.id_horario
           AND ex.fecha = a.fecha) AS excepcion_salida,
        (SELECT count(*)
         FROM ajuste_jornada aj
         WHERE aj.id_empleado = a.id_empleado
           AND aj.fecha_operativa = a.fecha
           AND aj.estado = 'ACTIVO') AS ajustes_activos
    FROM asistencia a
    WHERE a.fecha < DATE '2026-11-01'
      AND a.fecha_hora_ingreso IS NOT NULL
      AND a.fecha_hora_salida IS NULL
), resolved AS (
    SELECT base.*,
           CASE
               WHEN entrada_programada IS NOT NULL THEN entrada_programada
               WHEN excepcion_count = 1 AND excepcion_laborable IS TRUE THEN excepcion_entrada
               ELSE detalle_entrada
           END AS entrada_efectiva,
           CASE
               WHEN salida_programada IS NOT NULL THEN salida_programada
               WHEN excepcion_count = 1 AND excepcion_laborable IS TRUE THEN excepcion_salida
               ELSE detalle_salida
           END AS salida_efectiva
    FROM base
), final_rows AS (
    SELECT resolved.*,
           fecha::timestamp + salida_efectiva
             + CASE
                   WHEN salida_efectiva <= entrada_efectiva THEN INTERVAL '1 day'
                   ELSE INTERVAL '0 day'
               END AS salida_historica
    FROM resolved
)
SELECT *
FROM final_rows;

DO $$
DECLARE
    v_bad integer;
    v_ids text;
BEGIN
    SELECT count(*)
    INTO v_bad
    FROM _historical_auto_close
    WHERE horario_count <> 1
       OR detalle_count <> 1
       OR entrada_efectiva IS NULL
       OR salida_efectiva IS NULL
       OR (
              salida_programada IS NULL
          AND (
                 excepcion_count > 1
              OR (excepcion_count = 1 AND excepcion_laborable IS DISTINCT FROM TRUE)
              OR ajustes_activos <> 0
          )
       )
       OR salida_historica <= fecha_hora_ingreso;

    IF v_bad > 0 THEN
        SELECT string_agg(id::text, ', ' ORDER BY id)
        INTO v_ids
        FROM _historical_auto_close
        WHERE horario_count <> 1
           OR detalle_count <> 1
           OR entrada_efectiva IS NULL
           OR salida_efectiva IS NULL
           OR (
                  salida_programada IS NULL
              AND (
                     excepcion_count > 1
                  OR (excepcion_count = 1 AND excepcion_laborable IS DISTINCT FROM TRUE)
                  OR ajustes_activos <> 0
              )
           )
           OR salida_historica <= fecha_hora_ingreso;

        RAISE EXCEPTION
            'No se puede determinar una salida automatica segura para % fila(s): %',
            v_bad,
            v_ids;
    END IF;

    SELECT count(*)
    INTO v_bad
    FROM (
        SELECT t.id
        FROM _historical_auto_close t
        JOIN presencia_tramo p
          ON p.id_empleado = t.id_empleado
         AND p.fecha = t.fecha
         AND p.fin IS NULL
        WHERE p.inicio >= t.salida_historica
        GROUP BY t.id
    ) q;

    IF v_bad > 0 THEN
        RAISE EXCEPTION
            'Hay presencia abierta posterior a la salida historica en % fila(s)',
            v_bad;
    END IF;

    SELECT count(*)
    INTO v_bad
    FROM (
        SELECT t.id
        FROM _historical_auto_close t
        JOIN presencia_tramo p
          ON p.id_empleado = t.id_empleado
         AND p.fecha = t.fecha
         AND p.fin IS NULL
        GROUP BY t.id
        HAVING count(*) > 1
    ) q;

    IF v_bad > 0 THEN
        RAISE EXCEPTION
            'Hay mas de una presencia abierta para % jornada(s)',
            v_bad;
    END IF;
END $$;

-- Previsualizacion dentro de la misma transaccion.
SELECT
    count(*) AS filas_a_cerrar,
    min(salida_historica) AS primera_salida,
    max(salida_historica) AS ultima_salida
FROM _historical_auto_close;

SELECT
    id,
    id_empleado,
    fecha,
    fecha_hora_ingreso,
    entrada_efectiva,
    salida_efectiva,
    salida_historica
FROM _historical_auto_close
ORDER BY fecha, id;

-- Cierre idempotente de la asistencia principal.
UPDATE asistencia a
SET fecha_hora_salida = t.salida_historica,
    salida_forzada = TRUE,
    estado_actual = 'OFFLINE',
    updated_at = CURRENT_TIMESTAMP
FROM _historical_auto_close t
WHERE a.id = t.id
  AND a.fecha_hora_salida IS NULL;

-- Solo cierra presencias que sigan abiertas para la misma jornada.
-- No modifica presencias ya cerradas.
UPDATE presencia_tramo p
SET fin = t.salida_historica,
    origen_fin = 'AUTO_CIERRE',
    estado_al_desconectar = 'OFFLINE'
FROM _historical_auto_close t
WHERE p.id_empleado = t.id_empleado
  AND p.fecha = t.fecha
  AND p.fin IS NULL;

-- Validacion posterior: debe devolver 0.
SELECT count(*) AS jornadas_abiertas_restantes
FROM asistencia
WHERE fecha < DATE '2026-11-01'
  AND fecha_hora_ingreso IS NOT NULL
  AND fecha_hora_salida IS NULL;

COMMIT;
