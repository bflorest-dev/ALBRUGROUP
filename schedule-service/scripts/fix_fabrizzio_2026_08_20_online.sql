-- Caso: Fabrizzio Farith Veliz Kruchinsky
-- Fecha: 2026-08-20
-- Empleado: 2
-- Username auth: F71083767V@albru.sales.pe
--
-- Diagnostico tomado de la copia local:
-- - horario vigente: 76
-- - horario base de hoy: 14:00-18:00
-- - ajustes extra que estorban hoy: 385 (08:00-13:00), 387 (13:30-14:00)
-- - asistencia dañada de hoy: 1552
-- - no tiene registros en asistencia_tramo ni sesion_estado para esa asistencia
--
-- Efecto del fix:
-- 1) cancela los dos ajustes extra de hoy
-- 2) reutiliza la asistencia 1552 como marcacion normal del turno base
-- 3) deja al empleado ONLINE desde las 13:55 con su horario normal 14:00-18:00
--
-- Ejecutar:
-- docker exec -it albrugroup-postgres-core-1 psql -U postgres -d schedule_db -f schedule-service/scripts/fix_fabrizzio_2026_08_20_online.sql

BEGIN;

DO $$
DECLARE
    v_horario_id BIGINT;
    v_asistencia_id BIGINT;
    v_ajustes_activos INTEGER;
    v_tramos INTEGER;
    v_sesiones INTEGER;
BEGIN
    SELECT h.id
    INTO v_horario_id
    FROM horario h
    WHERE h.id_empleado = 2
      AND DATE '2026-08-20' >= h.fecha_inicio
      AND (h.fecha_fin IS NULL OR DATE '2026-08-20' <= h.fecha_fin)
    ORDER BY h.fecha_inicio DESC, h.id DESC
    LIMIT 1;

    IF v_horario_id IS DISTINCT FROM 76 THEN
        RAISE EXCEPTION 'Safety stop: horario vigente esperado=76, actual=%', v_horario_id;
    END IF;

    SELECT a.id
    INTO v_asistencia_id
    FROM asistencia a
    WHERE a.id_empleado = 2
      AND a.fecha = DATE '2026-08-20'
    FOR UPDATE;

    IF v_asistencia_id IS DISTINCT FROM 1552 THEN
        RAISE EXCEPTION 'Safety stop: asistencia esperada=1552, actual=%', v_asistencia_id;
    END IF;

    SELECT COUNT(*)
    INTO v_ajustes_activos
    FROM ajuste_jornada aj
    WHERE aj.id_empleado = 2
      AND aj.fecha_operativa = DATE '2026-08-20'
      AND aj.estado = 'ACTIVO'
      AND aj.id IN (385, 387);

    IF v_ajustes_activos <> 2 THEN
        RAISE EXCEPTION 'Safety stop: se esperaban 2 ajustes activos (385,387) y se encontraron %', v_ajustes_activos;
    END IF;

    SELECT COUNT(*)
    INTO v_tramos
    FROM asistencia_tramo at
    WHERE at.asistencia_id = 1552;

    IF v_tramos <> 0 THEN
        RAISE EXCEPTION 'Safety stop: asistencia_tramo para 1552 no esta vacio (% filas)', v_tramos;
    END IF;

    SELECT COUNT(*)
    INTO v_sesiones
    FROM sesion_estado se
    WHERE se.asistencia_id = 1552;

    IF v_sesiones <> 0 THEN
        RAISE EXCEPTION 'Safety stop: sesion_estado para 1552 no esta vacio (% filas)', v_sesiones;
    END IF;
END $$;

UPDATE ajuste_jornada
SET estado = 'CANCELADO',
    updated_at = NOW()
WHERE id IN (385, 387)
  AND id_empleado = 2
  AND fecha_operativa = DATE '2026-08-20'
  AND estado = 'ACTIVO';

UPDATE asistencia
SET id_horario = 76,
    estado_actual = 'ONLINE',
    entrada_programada = TIME '14:00:00',
    salida_programada = TIME '18:00:00',
    inicio_almuerzo_programado = NULL,
    fin_almuerzo_programado = NULL,
    fecha_hora_ingreso = TIMESTAMP '2026-08-20 13:55:00',
    fecha_hora_salida = NULL,
    fecha_hora_inicio_almuerzo = NULL,
    fecha_hora_fin_almuerzo = NULL,
    fecha_hora_inicio_servicios_actual = NULL,
    almuerzo_estado_desde = NULL,
    almuerzo_real_inicio = NULL,
    almuerzo_real_fin = NULL,
    origen_almuerzo = NULL,
    minutos_objetivo_dia = 240,
    minutos_trabajados = 0,
    minutos_balance = 0,
    minutos_almuerzo_tomados = 0,
    minutos_servicios_permitidos = 20,
    minutos_servicios_acumulados = 0,
    excedio_servicios = FALSE,
    minutos_extra = 0,
    minutos_compensados = 0,
    ajuste_jornada_actual_id = NULL,
    origen_tramo_actual = 'BASE',
    updated_at = NOW()
WHERE id = 1552
  AND id_empleado = 2
  AND fecha = DATE '2026-08-20';

SELECT
    a.id,
    a.id_empleado,
    a.id_horario,
    a.fecha,
    a.estado_actual,
    a.entrada_programada,
    a.salida_programada,
    a.fecha_hora_ingreso,
    a.fecha_hora_salida,
    a.ajuste_jornada_actual_id,
    a.origen_tramo_actual,
    a.minutos_objetivo_dia,
    a.minutos_trabajados,
    a.minutos_balance,
    a.minutos_extra,
    a.minutos_compensados
FROM asistencia a
WHERE a.id = 1552;

SELECT
    aj.id,
    aj.fecha_operativa,
    aj.inicio,
    aj.fin,
    aj.estado,
    aj.origen,
    aj.razon,
    aj.motivo
FROM ajuste_jornada aj
WHERE aj.id IN (385, 387)
ORDER BY aj.id;

COMMIT;
