-- Ejecutar en schedule_db.
--
-- Paso 0: reemplaza estos valores antes de correr.
--   v_id_empleado       -> id real obtenido desde rrhh_db
--   v_fecha_operativa   -> fecha a corregir
--   v_entrada_esperada  -> horario normal esperado
--   v_salida_esperada   -> horario normal esperado
--   v_ajuste_objetivo   -> id del ajuste ACTIVO a cancelar luego de revisar el diagnostico
--
-- Este script:
-- 1) muestra el horario base del dia
-- 2) muestra si existe excepcion_horario para esa fecha
-- 3) muestra ajustes activos del dia
-- 4) cancela solo el ajuste ACTIVO cuyo id confirmes manualmente
-- 5) verifica la asistencia del dia
--
-- Importante:
-- - no fuerza ONLINE
-- - no inventa marcaciones
-- - solo neutraliza el ajuste que esta reemplazando mal el base
--
-- Si ya hubiera una asistencia abierta/cerrada de hoy y sigue bloqueando la marca, revisar manualmente
-- la fila de asistencia antes de resetearla, para no borrar trabajo real.

BEGIN;

CREATE TEMP TABLE tmp_fix_turno_normal_params (
    id_empleado BIGINT,
    fecha_operativa DATE,
    entrada_esperada TIME,
    salida_esperada TIME,
    ajuste_objetivo BIGINT
) ON COMMIT DROP;

INSERT INTO tmp_fix_turno_normal_params (id_empleado, fecha_operativa, entrada_esperada, salida_esperada, ajuste_objetivo)
VALUES
    (0, DATE '2026-08-20', TIME '14:00', TIME '18:00', 0);

CREATE TEMP TABLE tmp_fix_turno_normal_base AS
SELECT
    p.id_empleado,
    p.fecha_operativa,
    h.id AS horario_id,
    hd.dia,
    hd.hora_entrada AS hora_entrada_base,
    hd.hora_salida AS hora_salida_base,
    p.entrada_esperada,
    p.salida_esperada
FROM tmp_fix_turno_normal_params p
JOIN horario h
  ON h.id_empleado = p.id_empleado
 AND p.fecha_operativa >= h.fecha_inicio
 AND (h.fecha_fin IS NULL OR p.fecha_operativa <= h.fecha_fin)
JOIN horario_detalle hd
  ON hd.horario_id = h.id
 AND hd.laborable = TRUE
 AND hd.dia = CASE EXTRACT(ISODOW FROM p.fecha_operativa)
     WHEN 1 THEN 'LUNES'
     WHEN 2 THEN 'MARTES'
     WHEN 3 THEN 'MIERCOLES'
     WHEN 4 THEN 'JUEVES'
     WHEN 5 THEN 'VIERNES'
     WHEN 6 THEN 'SABADO'
     WHEN 7 THEN 'DOMINGO'
 END;

CREATE TEMP TABLE tmp_fix_turno_normal_ajustes_activos AS
SELECT
    aj.id,
    aj.id_empleado,
    aj.horario_id,
    aj.fecha_operativa,
    aj.inicio,
    aj.fin,
    aj.estado,
    aj.origen,
    aj.razon,
    aj.motivo,
    aj.creado_por,
    aj.reemplazado_por_id,
    aj.created_at,
    aj.updated_at,
    b.hora_entrada_base,
    b.hora_salida_base,
    b.entrada_esperada,
    b.salida_esperada
FROM ajuste_jornada aj
JOIN tmp_fix_turno_normal_base b
  ON b.id_empleado = aj.id_empleado
 AND b.fecha_operativa = aj.fecha_operativa
WHERE aj.estado = 'ACTIVO';

-- Diagnostico 1: horario base esperado del dia
SELECT
    'BASE_DEL_DIA' AS bloque,
    *
FROM tmp_fix_turno_normal_base;

-- Diagnostico 2: ajustes activos que afectan el dia
SELECT
    'EXCEPCION_DEL_DIA' AS bloque,
    eh.id,
    eh.fecha,
    eh.tipo,
    eh.hora_entrada,
    eh.hora_salida,
    eh.inicio_almuerzo,
    eh.fin_almuerzo,
    eh.laborable,
    eh.motivo
FROM excepcion_horario eh
JOIN tmp_fix_turno_normal_base b
  ON b.horario_id = eh.horario_id
 AND b.fecha_operativa = eh.fecha;

-- Diagnostico 3: ajustes activos que afectan el dia
SELECT
    'AJUSTES_ACTIVOS' AS bloque,
    id,
    fecha_operativa,
    inicio,
    fin,
    origen,
    razon,
    estado,
    motivo,
    created_at
FROM tmp_fix_turno_normal_ajustes_activos
ORDER BY inicio, id;

-- Diagnostico 4: asistencia actual del dia
SELECT
    'ASISTENCIA_ACTUAL_ANTES' AS bloque,
    a.id,
    a.id_empleado,
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
JOIN tmp_fix_turno_normal_params p
  ON p.id_empleado = a.id_empleado
 AND p.fecha_operativa = a.fecha;

-- Safety check:
-- - Debes reemplazar id_empleado
-- - Debes elegir manualmente el id del ajuste ACTIVO a cancelar
DO $$
DECLARE
    v_id_empleado BIGINT;
    v_ajuste_objetivo BIGINT;
    v_count INTEGER;
BEGIN
    SELECT id_empleado, ajuste_objetivo
    INTO v_id_empleado, v_ajuste_objetivo
    FROM tmp_fix_turno_normal_params;

    IF v_id_empleado = 0 THEN
        RAISE EXCEPTION 'Debes reemplazar v_id_empleado=0 por el id real del empleado.';
    END IF;

    IF v_ajuste_objetivo = 0 THEN
        RAISE EXCEPTION 'Revisa el diagnostico y reemplaza v_ajuste_objetivo=0 por el id exacto del ajuste ACTIVO a cancelar.';
    END IF;

    SELECT COUNT(*) INTO v_count
    FROM ajuste_jornada aj
    JOIN tmp_fix_turno_normal_params p
      ON p.id_empleado = aj.id_empleado
     AND p.fecha_operativa = aj.fecha_operativa
    WHERE aj.id = v_ajuste_objetivo
      AND aj.estado = 'ACTIVO';

    IF v_count = 0 THEN
        RAISE EXCEPTION 'El ajuste indicado no existe o ya no esta ACTIVO para ese empleado y fecha.';
    END IF;
END $$;

-- Fix: cancelar solo el ajuste que confirmaste manualmente.
UPDATE ajuste_jornada aj
SET estado = 'CANCELADO',
    updated_at = NOW()
FROM tmp_fix_turno_normal_params p
WHERE aj.id = p.ajuste_objetivo
  AND aj.id_empleado = p.id_empleado
  AND aj.fecha_operativa = p.fecha_operativa
  AND aj.estado = 'ACTIVO';

-- Verificacion posterior del ajuste cancelado.
SELECT
    'AJUSTE_CANCELADO' AS bloque,
    aj.id,
    aj.id_empleado,
    aj.fecha_operativa,
    aj.inicio,
    aj.fin,
    aj.origen,
    aj.razon,
    aj.estado,
    aj.motivo,
    aj.updated_at
FROM ajuste_jornada aj
JOIN tmp_fix_turno_normal_params p
  ON p.ajuste_objetivo = aj.id;

-- Verificacion de asistencia del dia, por si ya existiera una fila previa.
SELECT
    'ASISTENCIA_ACTUAL_DESPUES' AS bloque,
    a.id,
    a.id_empleado,
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
JOIN tmp_fix_turno_normal_params p
  ON p.id_empleado = a.id_empleado
 AND p.fecha_operativa = a.fecha;

COMMIT;
