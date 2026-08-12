-- ============================================================
-- V14: Backfill de agosto al modelo nuevo (liviano, migra lo que existe)
--
-- Corre en el cutover (deploy). Date-scoped (fecha >= 2026-08-01): procesa TODAS las filas de agosto
-- que existan en ese momento, sin importar cuantas (tolera el drift prod vs copia). No recalcula
-- objetivo ni balance: el objetivo viejo ya es NETO (el sistema viejo tambien restaba el almuerzo).
--
-- 1) Almuerzo: se copia la marca vieja a las columnas nuevas (split estado/real). origen = MANUAL.
-- 2) Servicios: se materializa una sesion_estado con el acumulado (para el read model nuevo).
-- Estados nuevos (PAUSA_ACTIVA / CAPACITACION) no existian -> 0. razon de ajustes -> se difiere.
-- Sin marcadores de backfill: agosto queda organico.
-- ============================================================

-- 1) Almuerzo: marca vieja -> columnas nuevas (solo filas que realmente marcaron almuerzo).
UPDATE asistencia
SET almuerzo_real_inicio  = fecha_hora_inicio_almuerzo,
    almuerzo_real_fin     = fecha_hora_fin_almuerzo,
    almuerzo_estado_desde = fecha_hora_inicio_almuerzo,
    origen_almuerzo       = 'MANUAL'
WHERE fecha >= '2026-08-01'
  AND fecha_hora_inicio_almuerzo IS NOT NULL;

-- 2) Servicios: una sesion sintetizada con el acumulado (solo importa la duracion para el total).
--    Ubicada a mitad de manana (entrada + 2h). Si entrada_programada fuese NULL, el INSERT falla
--    ruidoso por el NOT NULL de sesion_estado.inicio (comportamiento deseado: no migrar en silencio).
INSERT INTO sesion_estado (asistencia_id, tipo, inicio, fin, created_at)
SELECT id,
       'SERVICIOS',
       (fecha + entrada_programada + INTERVAL '2 hour'),
       (fecha + entrada_programada + INTERVAL '2 hour' + make_interval(mins => minutos_servicios_acumulados)),
       now()
FROM asistencia
WHERE fecha >= '2026-08-01'
  AND minutos_servicios_acumulados > 0;
