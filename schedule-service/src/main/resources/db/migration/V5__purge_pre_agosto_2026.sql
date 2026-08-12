-- ============================================================
-- V5: Purga de datos de asistencia anteriores a agosto 2026
--
-- Rediseño de asistencias: solo se conserva AGOSTO (mes objetivo). Los meses
-- previos son data erratica de la etapa de desarrollo y se descartan.
-- Corte: fecha < 2026-08-01. Reproducible (misma migracion en local y prod).
--
-- NO toca horario / horario_detalle / politica_modalidad (plantilla vigente).
-- Orden respetando FKs: se limpian self-refs, luego hijos, luego padres.
-- ============================================================

-- 1) Romper self-FK de ajustes pre-agosto para poder borrarlos sin violacion
UPDATE ajuste_jornada
    SET reemplazado_por_id = NULL
    WHERE fecha_operativa < '2026-08-01';

-- 2) Tramos de asistencias pre-agosto
DELETE FROM asistencia_tramo
    WHERE asistencia_id IN (SELECT id FROM asistencia WHERE fecha < '2026-08-01');

-- 3) Asistencias pre-agosto (antes que ajuste_jornada: FK ajuste_jornada_actual_id)
DELETE FROM asistencia
    WHERE fecha < '2026-08-01';

-- 4) Ajustes de jornada pre-agosto
DELETE FROM ajuste_jornada
    WHERE fecha_operativa < '2026-08-01';

-- 5) Excepciones de horario pre-agosto (solo hay de junio; queda vacia)
DELETE FROM excepcion_horario
    WHERE fecha < '2026-08-01';
